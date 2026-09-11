"use client";

import { useI18n } from "@/i18n/provider";
import { useInstallAppOffer } from "@/lib/use-install-app-offer";

export function InstallAppBanner() {
  const { t } = useI18n();
  const { mode, promptInstall, dismiss } = useInstallAppOffer();

  if (mode === "hidden") {
    return null;
  }

  return (
    <aside className="install-banner" aria-label={t.install.title}>
      <div className="install-banner-card">
        <div className="install-banner-copy">
          <h2 className="install-banner-title">{t.install.title}</h2>
          <p>{mode === "ios" ? t.install.iosBody : t.install.androidBody}</p>
        </div>
        <div className="install-banner-actions">
          {mode === "android" ? (
            <button
              type="button"
              className="button"
              onClick={() => void promptInstall()}
            >
              {t.install.androidAction}
            </button>
          ) : null}
          <button
            type="button"
            className="button-ghost"
            onClick={dismiss}
            aria-label={t.install.dismissAria}
          >
            {t.install.dismiss}
          </button>
        </div>
      </div>
    </aside>
  );
}
