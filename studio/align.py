"""Transcrit la voix (faster-whisper) et cale chaque mot du SCRIPT sur l'audio.
Les mots affichés viennent du script (orthographe correcte), les temps viennent de la transcription.
Les mots écrits EN MAJUSCULES dans le script sont marqués "red" (mots-clés en rouge)."""
import re, json, subprocess, unicodedata
from difflib import SequenceMatcher
import numpy as np

def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s)

def parts(s):
    return [p for p in (norm(x) for x in re.split(r"[\s'’\-]+", s)) if p]

def script_tokens(script):
    text = re.sub(r'\[[^\]]*\]', ' ', script)          # retire les balises ElevenLabs
    raw = text.split()
    toks = []
    pending_prefix = ''
    for r in raw:
        if not norm(r):                                  # ponctuation seule : « » : ? ! …
            if r in ('«', '“', '"', '(') :
                pending_prefix += r + ' '
            elif toks:
                toks[-1]['w'] += ' ' + r
            continue
        letters = re.sub(r'[^A-Za-zÀ-ÖØ-öø-ÿ]', '', r)
        red = len(letters) >= 2 and letters == letters.upper()
        toks.append({'w': pending_prefix + r, 'red': red})
        pending_prefix = ''
    return toks

def transcribe(audio_path, model_size='small'):
    from faster_whisper import WhisperModel
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio_path, '-ar', '16000', '-ac', '1', '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, dtype=np.float32)
    m = WhisperModel(model_size, device='cpu', compute_type='int8')
    segs, _ = m.transcribe(a, language='fr', word_timestamps=True)
    out = []
    for s in segs:
        for w in s.words:
            out.append({'w': w.word.strip(), 's': float(w.start), 'e': float(w.end)})
    return out

def align(script, wwords):
    toks = script_tokens(script)
    a, a_own = [], []
    for i, t in enumerate(toks):
        for p in parts(t['w']):
            a.append(p); a_own.append(i)
    b, b_t = [], []
    for w in wwords:
        for p in parts(w['w']):
            b.append(p); b_t.append((w['s'], w['e']))
    sm = SequenceMatcher(None, a, b, autojunk=False)
    times = [None] * len(toks)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            i = a_own[blk.a + k]; s, e = b_t[blk.b + k]
            if times[i] is None: times[i] = [s, e]
            else: times[i] = [min(times[i][0], s), max(times[i][1], e)]
    # interpolation des mots non trouvés
    n = len(toks); i = 0
    total_end = wwords[-1]['e'] if wwords else 1.0
    while i < n:
        if times[i] is not None: i += 1; continue
        j = i
        while j < n and times[j] is None: j += 1
        t0 = times[i - 1][1] if i > 0 else 0.0
        t1 = times[j][0] if j < n else total_end
        step = max(0.05, (t1 - t0) / (j - i))
        for k in range(i, j):
            times[k] = [t0 + (k - i) * step, t0 + (k - i + 1) * step]
        i = j
    matched = sum(1 for blk in sm.get_matching_blocks() for _ in range(blk.size))
    for t, tm in zip(toks, times):
        t['s'], t['e'] = round(tm[0], 3), round(tm[1], 3)
    return toks, matched / max(1, len(a))

if __name__ == '__main__':
    import sys
    script = json.load(open(sys.argv[1]))['script']
    ww = transcribe(sys.argv[2])
    toks, q = align(script, ww)
    json.dump(toks, open(sys.argv[3], 'w'), ensure_ascii=False, indent=0)
    print(f'alignement: {q:.0%} des mots retrouvés')
