// Speak identifiers digit by digit so customers can match the token on screen.
const digits = ["शून्य", "एक", "दुई", "तीन", "चार", "पाँच", "छ", "सात", "आठ", "नौ"];
const letters = ["ए", "बी", "सी", "डी", "ई", "एफ", "जी", "एच", "आई", "जे", "के", "एल", "एम", "एन", "ओ", "पी", "क्यू", "आर", "एस", "टी", "यू", "भी", "डब्ल्यू", "एक्स", "वाई", "जेड"];
export function spokenNepaliIdentifier(value: string): string {
  return value.replace(/KIOSK/gi, "किओस्क").replace(/TABLE_QR/gi, "टेबल क्यू आर")
    .replace(/TAKEAWAY/gi, "टेक अवे").replace(/Table/gi, "टेबल")
    .replace(/\/\s*R(\d+)/gi, " राउन्ड $1")
    .replace(/[A-Z]/gi, letter => ` ${letters[letter.toUpperCase().charCodeAt(0) - 65]} `)
    .replace(/[0-9०-९]/g, digit => ` ${digits[/[0-9]/.test(digit) ? Number(digit) : digit.charCodeAt(0) - 0x966]} `)
    .replace(/[-_/]/g, " ").replace(/\s+/g, " ").trim();
}
export function nepaliPickupText(token: string, table?: string): string {
  const tableText = table ? `, टेबल ${spokenNepaliIdentifier(table.replace(/^table\s*/i, ""))}` : "";
  return `टोकन नम्बर ${spokenNepaliIdentifier(token)}${tableText}। तपाईंको अर्डर तयार छ। कृपया काउन्टरबाट लिनुहोस्। धन्यवाद।`;
}
export function nepaliVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const nepali = voices.filter(voice => /^ne(?:[-_]|$)/i.test(voice.lang));
  return nepali.find(voice => /natural|neural/i.test(voice.name)) || nepali[0];
}
export function nepaliUtterance(text: string, voice: SpeechSynthesisVoice): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ne-NP";
  utterance.voice = voice;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 0.85;
  return utterance;
}
