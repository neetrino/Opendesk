export const VOICE_WAVEFORM_BAR_COUNT = 52;
export const VOICE_SEEK_STEP_SECONDS = 2;

/** Telegram-style `mm:ss` clock for the inline voice player. */
export function formatVoiceClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "00:00";
  }

  const seconds = Math.floor(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/** How many waveform bars should render as already played. */
export function playedBarCount(progress: number, barCount: number): number {
  if (barCount <= 0) {
    return 0;
  }
  const clamped = clamp01(progress);
  if (clamped <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(clamped * barCount));
}

export function progressFromClientX(
  clientX: number,
  left: number,
  width: number,
): number {
  if (width <= 0) {
    return 0;
  }
  return clamp01((clientX - left) / width);
}

/**
 * Stable decorative peaks when the audio bytes cannot be decoded
 * (signed R2 redirects are cross-origin).
 */
export function fallbackWaveform(seed: string, barCount: number): number[] {
  const count = Math.max(0, Math.floor(barCount));
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const peaks: number[] = [];
  for (let index = 0; index < count; index += 1) {
    hash ^= index + 1;
    hash = Math.imul(hash, 16777619);
    const unit = ((hash >>> 0) % 1000) / 1000;
    const envelope = 0.32 + 0.68 * Math.abs(Math.sin(index / 4.4 + (hash % 13)));
    peaks.push(Number((0.16 + (envelope * 0.5 + unit * 0.5) * 0.84).toFixed(3)));
  }
  return peaks;
}

export function peaksFromChannelData(
  samples: Float32Array,
  barCount: number,
): number[] {
  const count = Math.max(0, Math.floor(barCount));
  if (count === 0) {
    return [];
  }
  if (samples.length === 0) {
    return Array.from({ length: count }, () => 0.16);
  }

  const bucketSize = Math.max(1, Math.floor(samples.length / count));
  const raw: number[] = [];
  let max = 0;

  for (let index = 0; index < count; index += 1) {
    const start = index * bucketSize;
    const end = index === count - 1 ? samples.length : start + bucketSize;
    let peak = 0;
    for (let cursor = start; cursor < end; cursor += 1) {
      const value = Math.abs(samples[cursor] ?? 0);
      if (value > peak) {
        peak = value;
      }
    }
    raw.push(peak);
    if (peak > max) {
      max = peak;
    }
  }

  if (max <= 0) {
    return raw.map(() => 0.16);
  }

  return raw.map((peak) => Number((0.12 + (peak / max) * 0.88).toFixed(3)));
}
