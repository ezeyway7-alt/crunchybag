# Nepali TV announcements

Calls play three clips in sequence: the uploaded Kamala opening, one generated
pickup identifier, and the uploaded Kamala ending. Only the middle is synthesized
using the existing no-key Edge Nepali female voice. Its tone may differ from Kamala.
No ElevenLabs API is used. Customer names, phones, payments and addresses are not
sent to the speech service.

## Audio files

`public/audio/nepali-hybrid-v1/opening.mp3` and `ending.mp3` are unchanged copies of
the two user recordings in `public/`. The short recording says the opening; the
long recording supplies the closing message. Original uploads are preserved.
`token-sample.mp3` supplies POS-21 for Speaker Test. Regenerate only this middle
sample with `python scripts/generate-nepali-token-preview.py` (edge-tts==7.2.8).
The uploaded Kamala clips are never regenerated or replaced by this script.

The player decodes all three files before playing the quiet chime. It removes only
outer silence, adjusts loudness with a gain limit, adds short fades to avoid clicks,
and schedules 90 ms between clips. It never speaks the opening without a loaded
middle and ending. Mute, dismiss and leaving the TV cancel all remaining playback
and downloads. Queued announcements wait for the complete closing clip.

## Real order calls

`GET /api/v1/orders/display/<outlet>/announcement/?token=POS-21&round=1&part=token`
requests just the identifier. Prefixes are preserved and numbers are read as whole
numbers. Round numbers above one are included; table names remain on screen rather
than extending the spoken token. The default `part=full` remains for old clients.
Only a real active order and round belonging to that outlet can generate audio.

Celery prewarms the identifier while cooking. Files are cached by text and voice.
On a miss, the endpoint queues a deduplicated job and returns 202. The player checks
only the pending audio request for at most 35 seconds; orders still use WebSockets.
The worker retries failures with exponential backoff and logs terminal failures.
The new token URL and shorter text keep old full announcements out of this sequence.

## Deploy and test

1. Deploy the backend changes and restart Django/Daphne, Celery worker and beat.
2. Keep Redis and persistent media storage shared between web and worker processes.
3. Run `npm run build` and deploy all of `dist`, including `audio/nepali-hybrid-v1`.
4. Open the TV and click Speaker Test once to enable browser audio.
5. Call a ready order and check the opening, correct token and closing.

`TV_NEPALI_VOICE=ne-NP-HemkalaNeural` controls only the generated middle. New tokens
need worker internet access; cached tokens are reused. No API key or paid speech
API is configured. Edge TTS is not an official Azure API integration with an SLA.
Legacy v1/v2 recordings remain on disk but are not used by the TV player.
