export const INSTALL_BANNER_STORAGE_KEY = "opendesk.installBanner.dismissed";

const IOS_ALT_BROWSER = /crios|fxios|edgios|opios|opt\//;

export function isInstallBannerDismissed(value: string | null): boolean {
  return value === "1";
}

export function isStandaloneDisplay(options: {
  displayModeStandalone: boolean;
  iosStandalone: boolean;
}): boolean {
  return options.displayModeStandalone || options.iosStandalone;
}

/** iOS Safari only; missing from the standard `Navigator` type. */
export function readIosStandaloneFlag(navigator: Navigator): boolean {
  if (!("standalone" in navigator)) {
    return false;
  }
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIosLikeDevice(options: {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}): boolean {
  const ua = options.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    return true;
  }
  return options.platform === "MacIntel" && options.maxTouchPoints > 1;
}

/** Safari (or iPadOS Safari). Other iOS browsers cannot add a home-screen app. */
export function isIosSafariInstallSurface(options: {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}): boolean {
  if (!isIosLikeDevice(options)) {
    return false;
  }
  return !IOS_ALT_BROWSER.test(options.userAgent.toLowerCase());
}

export function shouldOfferIosInstall(options: {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  isStandalone: boolean;
}): boolean {
  if (options.isStandalone) {
    return false;
  }
  return isIosSafariInstallSurface(options);
}
