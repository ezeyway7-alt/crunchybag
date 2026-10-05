"""Generate complete sentence previews: pip install edge-tts==7.2.8."""
import asyncio
import json
from pathlib import Path
import edge_tts

OUTPUT = Path(__file__).resolve().parents[1] / 'public/audio/nepali-v2'
TEXT = 'टोकन नम्बर पी ओ एस एक्काइस। तपाईंको अर्डर तयार छ। कृपया काउन्टरबाट लिनुहोस्। धन्यवाद।'


async def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for filename, voice in [('sample', 'ne-NP-HemkalaNeural'), ('sample-male', 'ne-NP-SagarNeural')]:
        await edge_tts.Communicate(TEXT, voice, rate='-3%').save(str(OUTPUT / f'{filename}.mp3'))
        print(f'Generated {filename}', flush=True)
    (OUTPUT / 'manifest.json').write_text(json.dumps({'text': TEXT, 'rate': '-3%',
        'sample': 'ne-NP-HemkalaNeural', 'sample-male': 'ne-NP-SagarNeural'}, ensure_ascii=False, indent=2), encoding='utf-8')


if __name__ == '__main__':
    asyncio.run(main())
