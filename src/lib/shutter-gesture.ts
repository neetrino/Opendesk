export type ShutterPhase = "idle" | "pressing" | "recording";

export type ShutterReleaseAction =
  | "take-photo"
  | "keep-recording"
  | "stop-video"
  | "ignore";

export type ShutterCancelAction = "abort-press" | "keep-recording";

/**
 * Hold-to-start video must survive a slipped finger. The release that
 * started recording keeps the clip; the next tap stops and saves it.
 */
export function shutterReleaseAction(input: {
  phase: ShutterPhase;
  isHoldThatStartedRecording: boolean;
}): ShutterReleaseAction {
  if (input.phase === "idle") {
    return "ignore";
  }
  if (input.phase === "recording") {
    return input.isHoldThatStartedRecording ? "keep-recording" : "stop-video";
  }
  return "take-photo";
}

export function shutterCancelAction(phase: ShutterPhase): ShutterCancelAction {
  return phase === "recording" ? "keep-recording" : "abort-press";
}
