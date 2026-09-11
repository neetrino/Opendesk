"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_CAMERA_VIDEO_SECONDS } from "@/lib/constants";
import {
  cameraErrorFromUnknown,
  isCameraCaptureSupported,
  pickVideoMimeType,
  releaseMediaStream,
  requestCameraStream,
  snapshotVideoFrame,
  videoFilenameFor,
  type CameraCaptureError,
  type CameraFacing,
} from "@/lib/camera-capture";

type UseCameraCaptureOptions = {
  onAutoStopVideo?: (file: File) => void;
};

export function useCameraCapture({
  onAutoStopVideo,
}: UseCameraCaptureOptions = {}) {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const autoStoppedRef = useRef(false);
  const onAutoStopRef = useRef(onAutoStopVideo);
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<CameraFacing>("environment");
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [errorKey, setErrorKey] = useState<CameraCaptureError | null>(null);

  useEffect(() => {
    onAutoStopRef.current = onAutoStopVideo;
  }, [onAutoStopVideo]);

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const replaceStream = useCallback((next: MediaStream | null) => {
    releaseMediaStream(streamRef.current);
    streamRef.current = next;
    setStream(next);
  }, []);

  const close = useCallback(() => {
    clearTick();
    autoStoppedRef.current = false;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    chunksRef.current = [];
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    replaceStream(null);
    setRecording(false);
    setElapsedMs(0);
    setErrorKey(null);
    setIsOpen(false);
  }, [clearTick, replaceStream]);

  useEffect(() => {
    return () => {
      clearTick();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.stop();
      }
      releaseMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, [clearTick]);

  const open = useCallback(async () => {
    setIsOpen(true);
    setErrorKey(null);
    setFacing("environment");
    if (!isCameraCaptureSupported()) {
      replaceStream(null);
      setErrorKey("cameraUnsupported");
      return;
    }
    try {
      const next = await requestCameraStream("environment");
      replaceStream(next);
    } catch (error) {
      replaceStream(null);
      setErrorKey(cameraErrorFromUnknown(error));
    }
  }, [replaceStream]);

  const flip = useCallback(async () => {
    if (recording) {
      return;
    }
    const nextFacing: CameraFacing =
      facing === "environment" ? "user" : "environment";
    try {
      const next = await requestCameraStream(nextFacing);
      replaceStream(next);
      setFacing(nextFacing);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(cameraErrorFromUnknown(error));
    }
  }, [facing, recording, replaceStream]);

  const finalizeVideo = useCallback((recorder: MediaRecorder): File | null => {
    const mimeType = recorder.mimeType || "video/webm";
    const contentType = mimeType.split(";")[0]?.trim() || "video/webm";
    const blob = new Blob(chunksRef.current, { type: contentType });
    chunksRef.current = [];
    if (blob.size === 0) {
      return null;
    }
    return new File([blob], videoFilenameFor(mimeType), { type: contentType });
  }, []);

  const cancelVideo = useCallback(() => {
    clearTick();
    autoStoppedRef.current = false;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    chunksRef.current = [];
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    setRecording(false);
    setElapsedMs(0);
  }, [clearTick]);

  const stopVideo = useCallback((): Promise<File | null> => {
    const recorder = recorderRef.current;
    clearTick();
    if (!recorder || recorder.state === "inactive") {
      recorderRef.current = null;
      setRecording(false);
      setElapsedMs(0);
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const file = finalizeVideo(recorder);
        recorderRef.current = null;
        setRecording(false);
        setElapsedMs(0);
        resolve(file);
      };
      recorder.stop();
    });
  }, [clearTick, finalizeVideo]);

  const startVideo = useCallback((): boolean => {
    const live = streamRef.current;
    if (!live || recorderRef.current) {
      return false;
    }
    const mimeType = pickVideoMimeType();
    const recorder = mimeType
      ? new MediaRecorder(live, { mimeType })
      : new MediaRecorder(live);
    chunksRef.current = [];
    autoStoppedRef.current = false;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setRecording(true);
    tickRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      setElapsedMs(elapsed);
      if (
        elapsed >= MAX_CAMERA_VIDEO_SECONDS * 1000 &&
        !autoStoppedRef.current
      ) {
        autoStoppedRef.current = true;
        void stopVideo().then((file) => {
          if (file) {
            onAutoStopRef.current?.(file);
            replaceStream(null);
            setIsOpen(false);
            setErrorKey(null);
          }
        });
      }
    }, 200);
    recorder.start();
    return true;
  }, [replaceStream, stopVideo]);

  const takePhoto = useCallback(async (video: HTMLVideoElement | null) => {
    if (!video || recording) {
      return null;
    }
    return snapshotVideoFrame(video);
  }, [recording]);

  return {
    isOpen,
    stream,
    ready: stream !== null,
    errorKey,
    facing,
    recording,
    elapsedMs,
    open,
    close,
    flip,
    takePhoto,
    startVideo,
    stopVideo,
    cancelVideo,
  };
}
