"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  INSTALL_BANNER_STORAGE_KEY,
  INSTALL_BANNER_VISIBLE_MS,
  isInstallBannerDismissed,
  isStandaloneDisplay,
  readIosStandaloneFlag,
  shouldOfferIosInstall,
} from "@/lib/install-app";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallBannerMode = "hidden" | "android" | "ios";

const listeners = new Set<() => void>();
let androidPrompt: BeforeInstallPromptEvent | null = null;
let promptListenerBound = false;
let sessionDismissed = false;

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function readStandalone(): boolean {
  return isStandaloneDisplay({
    displayModeStandalone: window.matchMedia(
      "(display-mode: standalone)",
    ).matches,
    iosStandalone: readIosStandaloneFlag(window.navigator),
  });
}

function readDismissed(): boolean {
  try {
    return isInstallBannerDismissed(
      window.localStorage.getItem(INSTALL_BANNER_STORAGE_KEY),
    );
  } catch {
    return false;
  }
}

function bindPromptListener(): void {
  if (promptListenerBound || typeof window === "undefined") {
    return;
  }
  promptListenerBound = true;
  window.addEventListener("beforeinstallprompt", (event: Event) => {
    event.preventDefault();
    androidPrompt = event as BeforeInstallPromptEvent;
    emitChange();
  });
}

function subscribe(onStoreChange: () => void): () => void {
  bindPromptListener();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot(): InstallBannerMode {
  if (sessionDismissed || readStandalone() || readDismissed()) {
    return "hidden";
  }
  if (androidPrompt) {
    return "android";
  }
  if (
    shouldOfferIosInstall({
      userAgent: window.navigator.userAgent,
      platform: window.navigator.platform,
      maxTouchPoints: window.navigator.maxTouchPoints,
      isStandalone: false,
    })
  ) {
    return "ios";
  }
  return "hidden";
}

function getServerSnapshot(): InstallBannerMode {
  return "hidden";
}

/**
 * Whether to show the Add to Home Screen hint. Android uses the browser
 * install prompt; iOS Safari gets a short Share instruction. The hint hides
 * itself after {@link INSTALL_BANNER_VISIBLE_MS}; the dismiss control still
 * remembers the choice.
 */
export function useInstallAppOffer(): {
  mode: InstallBannerMode;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
} {
  const mode = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  async function promptInstall(): Promise<void> {
    if (!androidPrompt) {
      return;
    }
    await androidPrompt.prompt();
    androidPrompt = null;
    emitChange();
  }

  function dismiss(): void {
    sessionDismissed = true;
    try {
      window.localStorage.setItem(INSTALL_BANNER_STORAGE_KEY, "1");
    } catch {
      // Private mode or quota — hide for this visit only.
    }
    androidPrompt = null;
    emitChange();
  }

  useEffect(() => {
    if (mode === "hidden") {
      return;
    }
    const timer = window.setTimeout(() => {
      sessionDismissed = true;
      emitChange();
    }, INSTALL_BANNER_VISIBLE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [mode]);

  return { mode, promptInstall, dismiss };
}
