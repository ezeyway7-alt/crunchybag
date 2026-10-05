"""Generate only the dynamic middle of the hybrid speaker test (no paid API)."""
import asyncio
from pathlib import Path
import edge_tts


async def main():
    target = Path(__file__).resolve().parents[1] / 'public/audio/nepali-hybrid-v1/token-sample.mp3'
    target.parent.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate('पी ओ एस एक्काइस', 'ne-NP-HemkalaNeural', rate='-3%').save(str(target))


if __name__ == '__main__':
    asyncio.run(main())
