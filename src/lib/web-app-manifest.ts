import type { MetadataRoute } from "next";
import { buildJoinPath } from "@/lib/join-url";

export const WEB_APP_NAME = "OpenDesk";
export const WEB_APP_DESCRIPTION =
  "Shared Kanban board via a reusable join link — no registration";
/** Matches `--desk` so the status bar blends with the outer chrome. */
export const WEB_APP_THEME_COLOR = "#101814";
/** Matches `--canvas`. */
export const WEB_APP_BACKGROUND_COLOR = "#ebe4d4";
export const WEB_APP_SHORT_NAME_MAX = 12;

export const WEB_APP_ICONS = [
  {
    src: "/icons/icon-192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/icon-512-maskable.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
] as const satisfies NonNullable<MetadataRoute.Manifest["icons"]>;

export type WebAppManifestInput = {
  startUrl: string;
  name?: string;
};

/** Home-screen label; keep it short so iOS/Android do not ellipsize mid-word. */
export function shortAppName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= WEB_APP_SHORT_NAME_MAX) {
    return trimmed.length > 0 ? trimmed : WEB_APP_NAME;
  }
  return trimmed.slice(0, WEB_APP_SHORT_NAME_MAX);
}

export function buildBoardManifestPath(slug: string, joinToken: string): string {
  return `${buildJoinPath(slug, joinToken)}/manifest.webmanifest`;
}

/** Installable PWA manifest. No service worker — the board always comes from the server. */
export function buildWebAppManifest(
  input: WebAppManifestInput,
): MetadataRoute.Manifest {
  const name = input.name?.trim() || WEB_APP_NAME;

  return {
    id: input.startUrl,
    name,
    short_name: shortAppName(name),
    description: WEB_APP_DESCRIPTION,
    start_url: input.startUrl,
    scope: "/",
    display: "standalone",
    background_color: WEB_APP_BACKGROUND_COLOR,
    theme_color: WEB_APP_THEME_COLOR,
    icons: [...WEB_APP_ICONS],
  };
}
