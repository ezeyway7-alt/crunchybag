# Nepali TV announcements

The TV plays bundled MP3 recordings from `public/audio/nepali-v1`. It does not
use browser speech voices or contact a speech provider while announcing orders.
Click **Speaker Test** once after opening the TV to allow browser audio. The
same button also enables sound when muted. Keep the TV/device volume audible.

The voice says the token (letters and individual digits), optional table and
round, followed by:

> तपाईंको अर्डर तयार छ। कृपया काउन्टरबाट लिनुहोस्। धन्यवाद।

Unsupported custom table names are omitted from speech; the order token remains
the identifier. The quiet chime and all voice fragments share a single audio
context. Queued announcements wait for playback to finish. Mute, dismiss and
leaving the TV stop playback. Failed downloads can be retried with Speaker Test.

## Build and deploy

Run the normal `npm run build` and deploy the complete `dist` directory,
including `dist/audio/nepali-v1`. No backend change, API key, browser language
pack or runtime speech service is required. The web server must serve `.mp3`
files as audio rather than rewriting their paths to the SPA HTML page.

## Regenerate recordings (only when changing the voice/text)

Install `edge-tts==7.2.8` in a development Python environment, then run
`python scripts/generate-nepali-audio.py`. Existing recordings are preserved;
remove only the specific clips you intend to regenerate first.

The manifest records the text and generation settings. These assets use
`ne-NP-HemkalaNeural` at `-8%` speed, listed in Microsoft's
[Nepali voice documentation](https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts).
The generator uses [edge-tts](https://github.com/rany2/edge-tts) for one-time
generation of fixed phrases, letters and digits; it never submits customer data.
