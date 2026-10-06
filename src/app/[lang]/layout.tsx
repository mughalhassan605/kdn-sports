import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { AppMounted, Cursor } from "@/components/fx/Cursor";
import { AmbientLayer } from "@/components/shell/Ambient";
import { CartDrawer, Toast } from "@/components/shell/CartDrawer";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { SmoothScroll } from "@/components/shell/SmoothScroll";
import { site } from "@/data/site";
import { I18nProvider } from "@/i18n/client";
import { isLocale, locales } from "@/i18n/config";
import { dictFor } from "@/i18n/server";
import "../globals.css";

// One family on two axes: weight and width. Expanded for words, condensed for numbers.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

// Runs before first paint: marks the document as scripted so elements waiting
// for a GSAP reveal start hidden, and un-hides everything if the app has not
// mounted after six seconds (blocked scripts, a crashed bundle).
const BOOT = `(function(){var d=document.documentElement;d.dataset.js="1";setTimeout(function(){if(!d.dataset.app)d.dataset.js="fail"},6000)})()`;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = dictFor(isLocale(lang) ? lang : "de");
  return {
    metadataBase: new URL(site.url),
    title: { default: t.meta.title, template: `%s | ${site.name}` },
    description: t.meta.description,
    alternates: { languages: { de: "/", en: "/en" } },
    openGraph: { siteName: site.name, type: "website", locale: lang === "en" ? "en_GB" : "de_DE" },
  };
}

export const viewport: Viewport = { themeColor: "#08080a", colorScheme: "dark" };

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = dictFor(lang);

  return (
    // data-js is written by the boot script before React hydrates.
    <html lang={lang} className={`${archivo.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <Script id="boot" strategy="beforeInteractive">
          {BOOT}
        </Script>
        <I18nProvider locale={lang} t={t}>
          <SmoothScroll>
            <a
              href="#main"
              className="btn btn-paper fixed left-4 top-4 z-[70] -translate-y-24 focus-visible:translate-y-0"
            >
              {t.nav.skip}
            </a>
            <AmbientLayer />
            <Header />
            <main id="main" className="relative z-10">
              {children}
            </main>
            <Footer />
            <CartDrawer />
            <Toast />
            <Cursor />
            <AppMounted />
          </SmoothScroll>
        </I18nProvider>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
