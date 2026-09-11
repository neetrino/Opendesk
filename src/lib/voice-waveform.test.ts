import { describe, expect, it } from "vitest";
import {
  clamp01,
  fallbackWaveform,
  formatVoiceClock,
  peaksFromChannelData,
  playedBarCount,
  progressFromClientX,
  VOICE_WAVEFORM_BAR_COUNT,
} from "@/lib/voice-waveform";

describe("voice waveform helpers", () => {
  it("formats a padded mm:ss clock", () => {
    expect(formatVoiceClock(0)).toBe("00:00");
    expect(formatVoiceClock(2)).toBe("00:02");
    expect(formatVoiceClock(65.9)).toBe("01:05");
    expect(formatVoiceClock(Number.NaN)).toBe("00:00");
  });

  it("builds a stable decorative waveform from the same seed", () => {
    const first = fallbackWaveform("voice-a", VOICE_WAVEFORM_BAR_COUNT);
    const second = fallbackWaveform("voice-a", VOICE_WAVEFORM_BAR_COUNT);
    const other = fallbackWaveform("voice-b", VOICE_WAVEFORM_BAR_COUNT);

    expect(first).toHaveLength(VOICE_WAVEFORM_BAR_COUNT);
    expect(first).toEqual(second);
    expect(first).not.toEqual(other);
    expect(first.every((peak) => peak >= 0.16 && peak <= 1)).toBe(true);
  });

  it("reduces channel samples into normalized peaks", () => {
    const samples = Float32Array.from([0, 0.2, 0.8, 0.1, 0, 1, 0.3, 0.4]);
    const peaks = peaksFromChannelData(samples, 4);

    expect(peaks).toHaveLength(4);
    expect(Math.max(...peaks)).toBe(1);
    expect(peaks.every((peak) => peak >= 0.12 && peak <= 1)).toBe(true);
  });

  it("maps click position and playback progress onto the strip", () => {
    expect(progressFromClientX(50, 0, 100)).toBe(0.5);
    expect(progressFromClientX(-10, 0, 100)).toBe(0);
    expect(playedBarCount(0, 52)).toBe(0);
    expect(playedBarCount(0.5, 52)).toBe(26);
    expect(clamp01(1.4)).toBe(1);
  });
});
