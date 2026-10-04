"""One-time asset generation: pip install edge-tts==7.2.8

Run from any directory. The deployed app plays these bundled MP3s and needs
neither Python, a speech account, nor installed browser voices.
Only fixed public phrases are sent to the speech service (no customer data).
"""
import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/audio/nepali-v1"
VOICE = "ne-NP-HemkalaNeural"
PHRASES = {
    "token": "टोकन नम्बर",
    "ready": "तपाईंको अर्डर तयार छ। कृपया काउन्टरबाट लिनुहोस्। धन्यवाद।",
    "table": "टेबल",
    "round": "राउन्ड",
    "kiosk": "किओस्क",
    "takeaway": "टेक अवे",
    "table-qr": "टेबल क्यू आर",
}
PHRASES.update({f"digit-{i}": word for i, word in enumerate(
    ["शून्य", "एक", "दुई", "तीन", "चार", "पाँच", "छ", "सात", "आठ", "नौ"]
)})
PHRASES.update({f"letter-{chr(65+i)}": word for i, word in enumerate(
    ["ए", "बी", "सी", "डी", "ई", "एफ", "जी", "एच", "आई", "जे", "के", "एल", "एम", "एन", "ओ", "पी", "क्यू", "आर", "एस", "टी", "यू", "भी", "डब्ल्यू", "एक्स", "वाई", "जेड"]
)})


async def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(3)

    async def generate(key, text):
        target = OUTPUT / f"{key}.mp3"
        if target.exists() and target.stat().st_size > 1000:
            return
        async with semaphore:
            for attempt in range(3):
                try:
                    temporary = target.with_suffix(".tmp")
                    await edge_tts.Communicate(text, VOICE, rate="-8%").save(str(temporary))
                    temporary.replace(target)
                    print(f"Generated {key}", flush=True)
                    return
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2 ** attempt)

    await asyncio.gather(*(generate(key, text) for key, text in PHRASES.items()))
    (OUTPUT / "manifest.json").write_text(json.dumps({
        "voice": VOICE, "rate": "-8%", "phrases": PHRASES,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Verified {len(PHRASES)} clips", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
