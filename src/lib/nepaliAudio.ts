const AUDIO_BASE = "/audio/nepali-v1/";

// Fixed recordings keep the spoken token identical to the identifier on screen.
export function identifierClips(value: string): string[] {
  const parts = value.toUpperCase().match(/TABLE_QR|TAKEAWAY|KIOSK|TABLE|\/\s*R|[A-Z0-9०-९]|[^\s\-_/.,:]+/gu) || [];
  return parts.map(part => {
    if (/^\/\s*R$/.test(part)) return "round";
    const words: Record<string, string> = { TABLE_QR: "table-qr", TAKEAWAY: "takeaway", KIOSK: "kiosk", TABLE: "table" };
    if (words[part]) return words[part];
    if (/^[A-Z]$/.test(part)) return `letter-${part}`;
    if (/^[0-9]$/.test(part)) return `digit-${part}`;
    if (/^[०-९]$/.test(part)) return `digit-${part.charCodeAt(0) - 0x966}`;
    throw new Error("Unsupported spoken identifier");
  });
}

export function pickupClips(token: string, table?: string): string[] {
  const clips = ["token", ...identifierClips(token)];
  if (table) {
    // Custom table names may use characters outside the recorded alphabet.
    // The complete order token is always announced, even for those tables.
    try { clips.push("table", ...identifierClips(table.replace(/^table\s*/i, ""))); } catch { /* token identifies the order */ }
  }
  return [...clips, "ready"];
}

export class NepaliAudioPlayer {
  private context?: AudioContext;
  private buffers = new Map<string, Promise<AudioBuffer>>();
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

  private load(key: string): Promise<AudioBuffer> {
    const cached = this.buffers.get(key);
    if (cached) return cached;
    const ctx = this.getContext();
    const pending = (async () => {
      const response = await fetch(`${AUDIO_BASE}${key}.mp3`, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error("Nepali audio could not be loaded");
      return ctx.decodeAudioData(await response.arrayBuffer());
    })();
    this.buffers.set(key, pending);
    void pending.catch(() => this.buffers.delete(key));
    return pending;
  }

  async play(token: string, table?: string): Promise<void> {
    this.stop();
    const generation = this.generation;
    const ctx = this.getContext();
    if (ctx.state !== "running") throw new Error("Click Speaker Test to enable sound");
    const buffers = await Promise.all(pickupClips(token, table).map(key => this.load(key)));
    if (generation !== this.generation) return;
    if (ctx.state !== "running") throw new Error("Click Speaker Test to enable sound");

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
      buffers.forEach((buffer, index) => {
        // Remove encoder/utterance padding between identifier fragments.
        const samples = buffer.getChannelData(0);
        let first = 0, last = samples.length - 1;
        while (first < last && Math.abs(samples[first]) < 0.002) first++;
        while (last > first && Math.abs(samples[last]) < 0.002) last--;
        const offset = Math.max(0, first / buffer.sampleRate - 0.035);
        const duration = Math.min(buffer.duration, last / buffer.sampleRate + 0.07) - offset;
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = 0.85;
        source.connect(gain).connect(ctx.destination);
        this.gains.push(gain);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          if (index === buffers.length - 1 && generation === this.generation) {
            this.sources = [];
            this.gains = [];
            this.finish = undefined;
            resolve();
          }
        };
        this.sources.push(source);
        source.start(time, offset, duration);
        time += duration + 0.065;
      });
    });
  }
}
