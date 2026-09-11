"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_VOICE_NOTE_SECONDS } from "@/lib/constants";
import {
  isVoiceRecordingSupported,
  pickVoiceMimeType,
  voiceFilenameFor,
} from "@/lib/voice-recorder";

export type VoiceRecorderError = "microphoneDenied" | "voiceUnsupported";

type UseVoiceRecorderOptions = {
  onError: (key: VoiceRecorderError) => void;
  onAutoStop?: (file: File) => void;
};

function releaseStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Tap-to-start / tap-to-stop voice capture. Hold-to-record is intentionally
 * avoided because browsers drop the user-gesture for file and mic APIs.
 */
export function useVoiceRecorder({
  onError,
  onAutoStop,
}: UseVoiceRecorderOptions) {
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const autoStoppedRef = useRef(false);
  const onAutoStopRef = useRef(onAutoStop);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onAutoStopRef.current = onAutoStop;
    onErrorRef.current = onError;
  }, [onAutoStop, onError]);

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const finalizeFile = useCallback((recorder: MediaRecorder): File | null => {
    const mimeType = recorder.mimeType || "audio/webm";
    const contentType = mimeType.split(";")[0]?.trim() || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: contentType });
    chunksRef.current = [];
    if (blob.size === 0) {
      return null;
    }
    return new File([blob], voiceFilenameFor(mimeType), { type: contentType });
  }, []);

  const cancel = useCallback(() => {
    clearTick();
    autoStoppedRef.current = false;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    chunksRef.current = [];
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = () => {
        releaseStream(streamRef.current);
        streamRef.current = null;
      };
      recorder.stop();
    } else {
      releaseStream(streamRef.current);
      streamRef.current = null;
    }
    setRecording(false);
    setElapsedMs(0);
  }, [clearTick]);

  useEffect(() => () => cancel(), [cancel]);

  const stop = useCallback((): Promise<File | null> => {
    const recorder = recorderRef.current;
    clearTick();
    if (!recorder || recorder.state === "inactive") {
      releaseStream(streamRef.current);
      streamRef.current = null;
      recorderRef.current = null;
      setRecording(false);
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const file = finalizeFile(recorder);
        releaseStream(streamRef.current);
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        resolve(file);
      };
      recorder.stop();
    });
  }, [clearTick, finalizeFile]);

  const start = useCallback(async (): Promise<boolean> => {
    if (!isVoiceRecordingSupported()) {
      onErrorRef.current("voiceUnsupported");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickVoiceMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      autoStoppedRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      streamRef.current = stream;
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setRecording(true);

      tickRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current;
        setElapsedMs(elapsed);
        if (
          elapsed >= MAX_VOICE_NOTE_SECONDS * 1000 &&
          !autoStoppedRef.current
        ) {
          autoStoppedRef.current = true;
          void stop().then((file) => {
            if (file) {
              onAutoStopRef.current?.(file);
            }
          });
        }
      }, 200);

      recorder.start();
      return true;
    } catch {
      releaseStream(streamRef.current);
      streamRef.current = null;
      onErrorRef.current("microphoneDenied");
      return false;
    }
  }, [stop]);

  return { recording, elapsedMs, start, stop, cancel };
}
