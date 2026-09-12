import type { MetadataRoute } from "next";
import { buildWebAppManifest } from "@/lib/web-app-manifest";

export default function manifest(): MetadataRoute.Manifest {
  return buildWebAppManifest({});
}
