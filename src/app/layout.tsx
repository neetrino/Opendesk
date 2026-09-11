import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { DM_Sans, Noto_Sans_Armenian, Syne } from "next/font/google";
import { InstallAppBanner } from "@/components/install-app-banner";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { I18nProvider } from "@/i18n/provider";
import {
  WEB_APP_NAME,
  WEB_APP_THEME_COLOR,
} from "@/lib/web-app-manifest";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const notoArmenian = Noto_Sans_Armenian({
  variable: "--font-hy",
  subsets: ["armenian"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: WEB_APP_THEME_COLOR,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return {
    title: WEB_APP_NAME,
    description: t.meta.description,
    robots: { index: false, follow: false },
    appleWebApp: {
      capable: true,
      title: WEB_APP_NAME,
      statusBarStyle: "black-translucent",
    },
    other: {
      "apple-mobile-web-app-capable": "yes",
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        {
          url: "/icons/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${syne.variable} ${dmSans.variable} ${notoArmenian.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <I18nProvider locale={locale} dictionary={dictionary}>
          <div className="desk">
            <div className="workspace">
              <header className="site-header">
                <div className="shell site-header-inner">
                  <Link href="/" className="brand">
                    <Image
                      src="/logo.png"
                      alt="OpenDesk"
                      width={32}
                      height={32}
                      className="brand-logo"
                      priority
                    />
                    <span className="brand-copy">
                      <span className="brand-text">
                        Open<span>Desk</span>
                      </span>
                      <span className="brand-credit">{dictionary.common.credit}</span>
                    </span>
                  </Link>
                  <LanguageSwitcher />
                </div>
              </header>
              <InstallAppBanner />
              <main className="shell">{children}</main>
              <footer className="site-footer">
                <div className="shell">
                  <p className="site-footer-credit">{dictionary.common.credit}</p>
                </div>
              </footer>
            </div>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
