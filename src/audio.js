export class SoundEngine {
  context = null;
  current = null;
  generation = 0;
  async unlock() { this.context ||= new AudioContext(); await this.context.resume(); }
  stop() { this.generation++; if (this.current) { this.current.stop(); this.current = null; } }
  async play(theme, volume, custom) {
    this.stop(); const token = this.generation; await this.unlock();
    const ctx = this.context;
    let buffer;
    if (custom) buffer = await ctx.decodeAudioData(await custom.blob.arrayBuffer());
    else {
      const duration = theme === 'Heavy Duty' ? 1.5 : 0.85;
      buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0); let phase = 0; let noise = 0;
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate, progress = t / duration;
        const base = theme === 'Heavy Duty' ? 48 : theme === 'Musical Farts' ? [131,165,196,262][Math.min(3, Math.floor(progress * 4))] : 95 + 50 * Math.sin(t * 17);
        phase += 2 * Math.PI * base * (1 - progress * .4) / ctx.sampleRate;
        noise = noise * .8 + (Math.random() * 2 - 1) * .2;
        data[i] = (Math.sin(phase + Math.sin(phase * .51) * 2) * .65 + noise * .8) * Math.min(1,t * 60) * Math.pow(1-progress, .65) * (.65 + .35 * Math.sin(t * 70));
      }
    }
    if(token !== this.generation) return 0;
    const source = ctx.createBufferSource(), gain = ctx.createGain(); source.buffer = buffer; gain.gain.value = volume;
    source.connect(gain).connect(ctx.destination); this.current = source; source.start();
    source.onended = () => { if(this.current === source) this.current = null; };
    return buffer.duration;
  }
}
