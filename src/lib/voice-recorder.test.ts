import { describe, expect, it } from "vitest";
import { formatVoiceElapsed, voiceFilenameFor } from "@/lib/voice-recorder";

describe("voice recorder helpers", () => {
  it("formats elapsed time as m:ss", () => {
    expect(formatVoiceElapsed(0)).toBe("0:00");
    expect(formatVoiceElapsed(65000)).toBe("1:05");
  });

  it("picks an extension from the recorder mime type", () => {
    expect(voiceFilenameFor("audio/webm;codecs=opus")).toBe("voice-note.webm");
    expect(voiceFilenameFor("audio/mp4")).toBe("voice-note.m4a");
  });
});
