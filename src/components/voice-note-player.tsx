"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from "react";
import { useI18n } from "@/i18n/provider";
import { logger } from "@/lib/logger";
import {
  fallbackWaveform,
  formatVoiceClock,
  peaksFromChannelData,
  playedBarCount,
  progressFromClientX,
  VOICE_SEEK_STEP_SECONDS,
  VOICE_WAVEFORM_BAR_COUNT,
} from "@/lib/voice-waveform";

type VoiceNotePlayerProps = {
  src: string;
  filename: string;
  progress?: number;
};

let activeVoice: HTMLAudioElement | null = null;

function takeVoicePlayback(audio: HTMLAudioElement): void {
  if (activeVoice && activeVoice !== audio) {
    activeVoice.pause();
  }
  activeVoice = audio;
}

function releaseVoicePlayback(audio: HTMLAudioElement): void {
  if (activeVoice === audio) {
    activeVoice = null;
  }
}

function PlayGlyph(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M8 5.14v13.72c0 .74.8 1.2 1.45.83l10.1-6.86a.98.98 0 0 0 0-1.66L9.45 4.3A.98.98 0 0 0 8 5.14Z"
      />
    </svg>
  );
}

function PauseGlyph(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M7 5h3.2v14H7V5Zm6.8 0H17v14h-3.2V5Z" />
    </svg>
  );
}

/**
 * Inline Telegram-style voice player. Native `<audio controls>` collapse to a
 * menu button on Safari, so playback and the waveform are custom.
 */
export function VoiceNotePlayer({
  src,
  filename,
  progress,
}: VoiceNotePlayerProps) {
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [peaks, setPeaks] = useState(() =>
    fallbackWaveform(src, VOICE_WAVEFORM_BAR_COUNT),
  );
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const uploading = progress !== undefined && progress < 100;
  const ratio = duration > 0 ? currentTime / duration : 0;
  const playedCount = playedBarCount(ratio, peaks.length);
  const clock = formatVoiceClock(playing || currentTime > 0 ? currentTime : duration);

  useEffect(() => {
    setPeaks(fallbackWaveform(src, VOICE_WAVEFORM_BAR_COUNT));
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (!src.startsWith("blob:") || typeof AudioContext === "undefined") {
      return;
    }

    let cancelled = false;
    const context = new AudioContext();

    void (async () => {
      try {
        const response = await fetch(src);
        const buffer = await response.arrayBuffer();
        const decoded = await context.decodeAudioData(buffer.slice(0));
        if (cancelled) {
          return;
        }
        setPeaks(
          peaksFromChannelData(decoded.getChannelData(0), VOICE_WAVEFORM_BAR_COUNT),
        );
      } catch {
        // Keep the decorative waveform when the browser cannot decode the blob.
      } finally {
        if (context.state !== "closed") {
          void context.close();
        }
      }
    })();

    return () => {
      cancelled = true;
      if (context.state !== "closed") {
        void context.close();
      }
    };
  }, [src]);

  useEffect(() => {
    const node = audioRef.current;
    if (!node) {
      return;
    }
    const player: HTMLAudioElement = node;

    function syncTimes(): void {
      setCurrentTime(player.currentTime);
      if (Number.isFinite(player.duration)) {
        setDuration(player.duration);
      }
    }

    function onPlay(): void {
      takeVoicePlayback(player);
      setPlaying(true);
    }

    function onPause(): void {
      setPlaying(false);
      if (activeVoice === player) {
        releaseVoicePlayback(player);
      }
    }

    function onEnded(): void {
      player.currentTime = 0;
      setCurrentTime(0);
      setPlaying(false);
      releaseVoicePlayback(player);
    }

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onEnded);
    player.addEventListener("timeupdate", syncTimes);
    player.addEventListener("loadedmetadata", syncTimes);
    player.addEventListener("durationchange", syncTimes);

    return () => {
      player.pause();
      releaseVoicePlayback(player);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnded);
      player.removeEventListener("timeupdate", syncTimes);
      player.removeEventListener("loadedmetadata", syncTimes);
      player.removeEventListener("durationchange", syncTimes);
    };
  }, [src]);

  function seekTo(nextRatio: number): void {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }
    audio.currentTime = nextRatio * audio.duration;
    setCurrentTime(audio.currentTime);
  }

  function seekFromPointer(event: PointerEvent<HTMLDivElement>): void {
    const wave = waveRef.current;
    if (!wave) {
      return;
    }
    const rect = wave.getBoundingClientRect();
    seekTo(progressFromClientX(event.clientX, rect.left, rect.width));
  }

  async function togglePlayback(): Promise<void> {
    const audio = audioRef.current;
    if (!audio || uploading) {
      return;
    }

    if (!audio.paused) {
      audio.pause();
      return;
    }

    takeVoicePlayback(audio);
    try {
      await audio.play();
    } catch (error) {
      releaseVoicePlayback(audio);
      setPlaying(false);
      logger.warn("voice note play failed", error);
    }
  }

  function onWaveKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (uploading || duration <= 0) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta =
        event.key === "ArrowRight" ? VOICE_SEEK_STEP_SECONDS : -VOICE_SEEK_STEP_SECONDS;
      seekTo(clampDuration(currentTime + delta, duration) / duration);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      seekTo(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      seekTo(1);
    }
  }

  return (
    <div className={uploading ? "voice-note is-uploading" : "voice-note"}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        className="voice-note-play"
        onClick={() => {
          void togglePlayback();
        }}
        disabled={uploading}
        aria-label={`${playing ? t.comment.pauseVoice : t.comment.playVoice}: ${filename}`}
        aria-pressed={playing}
      >
        {playing ? <PauseGlyph /> : <PlayGlyph />}
      </button>
      <div className="voice-note-body">
        <div
          ref={waveRef}
          className="voice-note-wave"
          role="slider"
          tabIndex={uploading ? -1 : 0}
          aria-label={t.comment.voiceSeek}
          aria-valuemin={0}
          aria-valuemax={Math.max(0, Math.round(duration))}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={clock}
          aria-disabled={uploading}
          onPointerDown={(event) => {
            if (uploading) {
              return;
            }
            draggingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            seekFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (!draggingRef.current) {
              return;
            }
            seekFromPointer(event);
          }}
          onPointerUp={() => {
            draggingRef.current = false;
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
          onKeyDown={onWaveKeyDown}
        >
          {peaks.map((peak, index) => (
            <span
              key={`${src}-${index}`}
              className={
                index < playedCount ? "voice-note-bar is-played" : "voice-note-bar"
              }
              style={{ height: `${Math.max(18, peak * 100)}%` }}
            />
          ))}
        </div>
        <span className="voice-note-time">{clock}</span>
      </div>
      {uploading ? (
        <span className="media-thumb-progress">{progress}%</span>
      ) : null}
    </div>
  );
}

function clampDuration(value: number, duration: number): number {
  return Math.min(duration, Math.max(0, value));
}
