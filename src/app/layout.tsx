import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DM_Sans, Noto_Sans_Armenian, Syne } from "next/font/google";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { I18nProvider } from "@/i18n/provider";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return {
    title: "OpenDesk",
    description: t.meta.description,
    robots: { index: false, follow: false },
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
                <span className="brand-text">
                  Open<span>Desk</span>
                </span>
              </Link>
              <LanguageSwitcher />
            </div>
          </header>
          <main className="shell">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
