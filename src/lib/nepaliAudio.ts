import { DEFAULT_API_BASE } from "./api";

export const NEPALI_VOICE_SAMPLE = "/audio/nepali-hybrid-v1/token-sample.mp3";
const OPENING = "/audio/nepali-hybrid-v1/opening.mp3";
const ENDING = "/audio/nepali-hybrid-v1/ending.mp3";

// Trim only outer silence; retain the recording's internal rhythm and pronunciation.
function speechSegment(buffer: AudioBuffer) {
  const data = buffer.getChannelData(0);
  let first = 0, last = data.length - 1, peak = 0, sum = 0, count = 0;
  for (let i = 0; i < data.length; i++) {
    const level = Math.abs(data[i]);
    peak = Math.max(peak, level);
    if (level > 0.005) { sum += level * level; count++; }
  }
  if (!count) throw new Error("The voice recording is silent.");
  while (first < last && Math.abs(data[first]) < 0.0015) first++;
  while (last > first && Math.abs(data[last]) < 0.0015) last--;
  const offset = Math.max(0, first / buffer.sampleRate - 0.05);
  const duration = Math.min(buffer.duration, last / buffer.sampleRate + 0.07) - offset;
  const volume = Math.min(0.85 / peak, Math.max(0.5, Math.min(1.6, 0.12 / Math.sqrt(sum / count))));
  return {buffer, offset, duration, volume};
}

export function announcementAudioUrl(outletId: string, token: string): string {
  const match = token.match(/^(.*?)\s*\/\s*R(\d+)$/i);
  const query = new URLSearchParams({part: "token", token: match ? match[1].trim() : token.trim(), round: match ? match[2] : "1"});
  return `${DEFAULT_API_BASE}/orders/display/${encodeURIComponent(outletId)}/announcement/?${query}`;
}

export class NepaliAudioPlayer {
  private context?: AudioContext;
  private buffers = new Map<string, AudioBuffer>();
  private request?: AbortController;
  private sources: AudioScheduledSourceNode[] = [];
  private gains: GainNode[] = [];
  private generation = 0;
  private finish?: () => void;

  private getContext(): AudioContext {
    if (!this.context || this.context.state === "closed") {
      this.context = new AudioContext();
      this.buffers.clear();
    }
    return this.context;
  }

  // Call directly from a click handler, before fetching or awaiting anything.
  async unlock(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state !== "running") await ctx.resume();
  }

  stop(): void {
    this.generation++;
    this.request?.abort();
    this.request = undefined;
    for (const source of this.sources) {
      source.onended = null;
      try { source.stop(); } catch { /* already finished */ }
      source.disconnect();
    }
    this.sources = [];
    this.gains.forEach(gain => gain.disconnect());
    this.gains = [];
    this.finish?.();
    this.finish = undefined;
  }

  dispose(): void {
    this.stop();
    void this.context?.close();
    this.context = undefined;
    this.buffers.clear();
  }

  private async load(url: string, signal: AbortSignal): Promise<AudioBuffer> {
    const cached = this.buffers.get(url);
    if (cached) return cached;
    const context = this.getContext();
    for (let attempt = 0; attempt < 15; attempt++) {
      const response = await fetch(url, { signal });
      if (response.status === 202) {
        await new Promise<void>((resolve, reject) => {
          const cancel = () => { clearTimeout(timer); reject(new DOMException("Cancelled", "AbortError")); };
          const timer = setTimeout(() => { signal.removeEventListener("abort", cancel); resolve(); }, 2000);
          signal.addEventListener("abort", cancel, {once: true});
          if (signal.aborted) cancel();
        });
        continue;
      }
      if (!response.ok || !response.headers.get("Content-Type")?.startsWith("audio/")) {
        throw new Error("Nepali announcement is unavailable. Please try calling this order again.");
      }
      const bytes = await response.arrayBuffer();
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      const buffer = await context.decodeAudioData(bytes);
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      if (this.buffers.size >= 32) this.buffers.delete(this.buffers.keys().next().value!);
      this.buffers.set(url, buffer);
      return buffer;
    }
    throw new Error("The announcement is still being prepared. Please try the call again.");
  }

  async play(url: string): Promise<void> {
    this.stop();
    const generation = this.generation;
    const ctx = this.getContext();
    if (ctx.state !== "running") throw new Error("Click Speaker Test to enable sound");
    const request = new AbortController();
    this.request = request;
    const timeout = setTimeout(() => request.abort(), 35000);
    let buffers: AudioBuffer[];
    try { buffers = await Promise.all([OPENING, url, ENDING].map(part => this.load(part, request.signal))); }
    catch (error) { request.abort(); throw error; }
    finally { clearTimeout(timeout); }
    if (generation !== this.generation) return;
    if (ctx.state !== "running") throw new Error("Click Speaker Test to enable sound");

    const segments = buffers.map(speechSegment);
    const start = ctx.currentTime + 0.08;
    // A quiet, rounded three-note chime before the voice.
    [349.23, 440, 523.25].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = start + index * 0.22;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.07, time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.65);
      oscillator.connect(gain).connect(ctx.destination);
      this.gains.push(gain);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(time);
      oscillator.stop(time + 0.7);
      this.sources.push(oscillator);
    });

    await new Promise<void>(resolve => {
      this.finish = resolve;
      let time = start + 1.2;
      segments.forEach(({buffer, offset, duration, volume}, index) => {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.005);
        gain.gain.setValueAtTime(volume, time + duration - 0.005);
        gain.gain.linearRampToValueAtTime(0, time + duration);
        source.connect(gain).connect(ctx.destination);
        this.gains.push(gain);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          if (index === segments.length - 1 && generation === this.generation) {
            this.sources = [];
            this.gains = [];
            this.finish = undefined;
            resolve();
          }
        };
        this.sources.push(source);
        source.start(time, offset, duration);
        time += duration + 0.09;
      });
    });
  }
}
