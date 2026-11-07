"""Voix du jour N : ../jours/jourN/script.md (1re ligne = titre « # … », le reste = texte dit) → voix.mp3 + mots.json (temps de chaque mot).
ElevenLabs (secret ELEVENLABS_API_KEY), voix Leo, puis calage faster-whisper (align.py).
python voix.py N
"""
import os, sys, json, urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from align import transcribe, align

VOIX = {'voice_id': 'AfbuxQ9DVtS4azaxN1W7', 'model_id': 'eleven_v4', 'stability': 0.6, 'similarity_boost': 0.75, 'speed': 1.05, 'style': 0.0}

def tts(texte, out_mp3):
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key: sys.exit('ELEVENLABS_API_KEY manquante (secrets GitHub du dépôt pays-de-tous).')
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOIX['voice_id']}?output_format=mp3_44100_128"
    body = {'text': texte, 'model_id': VOIX['model_id'], 'voice_settings': {k: VOIX[k] for k in ('stability', 'similarity_boost', 'style', 'speed')}}
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method='POST', headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    try:
        with urllib.request.urlopen(req, timeout=300) as r: open(out_mp3, 'wb').write(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f'ElevenLabs a refusé ({e.code}) : {e.read().decode()[:500]}')

if __name__ == '__main__':
    d = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'jours', f'jour{sys.argv[1]}')
    texte = open(os.path.join(d, 'script.md')).read().split('\n', 1)[1].strip()
    print(len(texte), 'caractères')
    mp3 = os.path.join(d, 'voix.mp3'); tts(texte, mp3); print('voix.mp3 écrite')
    toks, q = align(texte, transcribe(mp3))
    json.dump(toks, open(os.path.join(d, 'mots.json'), 'w'), ensure_ascii=False, indent=0)
    print(f'mots.json : {len(toks)} mots, calage {q:.0%}, fin à {toks[-1]["e"]:.1f} s')
