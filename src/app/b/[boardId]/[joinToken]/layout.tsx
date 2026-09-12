import type { Metadata } from "next";
import { WEB_APP_NAME } from "@/lib/web-app-manifest";

type BoardSegmentLayoutProps = {
  children: React.ReactNode;
};

export const metadata: Metadata = {
  title: WEB_APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: WEB_APP_NAME,
    statusBarStyle: "black-translucent",
  },
};

export default function BoardSegmentLayout({
  children,
}: BoardSegmentLayoutProps) {
  return children;
}
