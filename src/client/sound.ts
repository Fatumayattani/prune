// Short synthesized sounds, so there are no audio files to load.
// The audio context starts on the first tap, as browsers require.

let context: AudioContext | undefined

function audio(): AudioContext | undefined {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
    return context
  } catch {
    return undefined
  }
}

/** Two quick blade clicks, like pruning shears closing. */
export function playSnip(): void {
  const ctx = audio()
  if (!ctx) return
  const now = ctx.currentTime
  for (const [delay, pitch] of [
    [0, 4200],
    [0.045, 3000],
  ] as const) {
    const length = Math.floor(ctx.sampleRate * 0.04)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = pitch
    filter.Q.value = 1.5
    const gain = ctx.createGain()
    gain.gain.value = 0.5
    source.connect(filter).connect(gain).connect(ctx.destination)
    source.start(now + delay)
  }
}

/** A soft thud for a branch landing. */
export function playThud(volume: number): void {
  const ctx = audio()
  if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(140, now)
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.12)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.35 * volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.16)
}

/** A tiny buzz on phones that support it. */
export function buzz(): void {
  try {
    navigator.vibrate?.(12)
  } catch {
    // Not supported; skip.
  }
}
