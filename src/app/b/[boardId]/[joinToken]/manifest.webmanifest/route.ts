import { NextResponse } from "next/server";
import { buildWebAppManifest } from "@/lib/web-app-manifest";

type LegacyBoardManifestRouteProps = {
  params: Promise<{ boardId: string; joinToken: string }>;
};

/**
 * Backward-compatible endpoint for previously installed board-scoped PWAs.
 * Every installation now shares the same root identity and launch URL.
 */
export async function GET(
  _request: Request,
  { params }: LegacyBoardManifestRouteProps,
): Promise<NextResponse> {
  await params;
  return NextResponse.json(buildWebAppManifest({}), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
