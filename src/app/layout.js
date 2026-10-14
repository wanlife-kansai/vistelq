import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AgeGate from "@/components/AgeGate";
import { getSiteUrl, isSeoEnabled } from "@/lib/site-url";
import { WorksProvider } from "@/lib/works-context";
import { getWorks } from "@/lib/works-db";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "VISTELQ｜動画作品検索・ランキング",
    template: "%s｜VISTELQ",
  },
  description: "VISTELQは動画作品の検索・ランキングサイトです。",
  robots: { index: isSeoEnabled(), follow: isSeoEnabled() },
  openGraph: { siteName: "VISTELQ", locale: "ja_JP", type: "website" },
};

// クライアントへ渡す作品データを軽量化（説明文を短縮、不要項目を除外）
function slim(work) {
  const { actresses, ...rest } = work;
  return {
    ...rest,
    actresses,
    description:
      typeof work.description === "string" && work.description.length > 160
        ? work.description.slice(0, 160) + "…"
        : work.description,
  };
}

// 作品データをDB(Neon)から取得して、全ページの画面へ配る
async function WorksLoader({ children }) {
  const works = await getWorks();
  return <WorksProvider works={works.map(slim)}>{children}</WorksProvider>;
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AgeGate />
        <Header />
        <Suspense fallback={null}>
          <WorksLoader>{children}</WorksLoader>
        </Suspense>
        <Footer />
      </body>
    </html>
  );
}
