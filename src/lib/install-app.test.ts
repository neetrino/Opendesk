import { describe, expect, it } from "vitest";
import {
  isInstallBannerDismissed,
  isIosLikeDevice,
  isStandaloneDisplay,
  shouldOfferIosInstall,
} from "@/lib/install-app";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

describe("isInstallBannerDismissed", () => {
  it("treats only the stored flag as dismissed", () => {
    expect(isInstallBannerDismissed("1")).toBe(true);
    expect(isInstallBannerDismissed(null)).toBe(false);
    expect(isInstallBannerDismissed("0")).toBe(false);
  });
});

describe("isStandaloneDisplay", () => {
  it("is true for CSS standalone or iOS navigator.standalone", () => {
    expect(
      isStandaloneDisplay({
        displayModeStandalone: true,
        iosStandalone: false,
      }),
    ).toBe(true);
    expect(
      isStandaloneDisplay({
        displayModeStandalone: false,
        iosStandalone: true,
      }),
    ).toBe(true);
    expect(
      isStandaloneDisplay({
        displayModeStandalone: false,
        iosStandalone: false,
      }),
    ).toBe(false);
  });
});

describe("shouldOfferIosInstall", () => {
  it("offers the hint in iPhone Safari", () => {
    expect(
      shouldOfferIosInstall({
        userAgent: IPHONE_SAFARI,
        platform: "iPhone",
        maxTouchPoints: 5,
        isStandalone: false,
      }),
    ).toBe(true);
  });

  it("hides the hint when already installed or in Chrome/Android", () => {
    expect(
      shouldOfferIosInstall({
        userAgent: IPHONE_SAFARI,
        platform: "iPhone",
        maxTouchPoints: 5,
        isStandalone: true,
      }),
    ).toBe(false);
    expect(
      shouldOfferIosInstall({
        userAgent: IPHONE_CHROME,
        platform: "iPhone",
        maxTouchPoints: 5,
        isStandalone: false,
      }),
    ).toBe(false);
    expect(
      shouldOfferIosInstall({
        userAgent: ANDROID_CHROME,
        platform: "Linux armv8l",
        maxTouchPoints: 5,
        isStandalone: false,
      }),
    ).toBe(false);
  });

  it("treats iPadOS (MacIntel + touch) as iOS", () => {
    expect(
      isIosLikeDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        platform: "MacIntel",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });
});
