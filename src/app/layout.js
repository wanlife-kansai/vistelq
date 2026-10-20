import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AgeGate from "@/components/AgeGate";
import { getSiteUrl, isSeoEnabled } from "@/lib/site-url";
import { WorksProvider } from "@/lib/works-context";
import { getFeaturedWorks, getWorkTotal } from "@/lib/works-db";
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
// 一覧で使わない項目（サンプル動画URL・購入リンク等）は作品ページ側でDBから取得する
function slim(work) {
  const { sampleEmbedUrl, affiliateUrl, mgsProductId, ...rest } = work;
  return {
    ...rest,
    description:
      typeof work.description === "string" && work.description.length > 80
        ? work.description.slice(0, 80) + "…"
        : work.description,
  };
}

// 注目作品（人気・新着・VRの上位）だけをDB(Neon)から取得して、全ページの画面へ配る
async function WorksLoader({ children }) {
  const [works, total] = await Promise.all([getFeaturedWorks(), getWorkTotal()]);
  return (
    <WorksProvider works={works.map(slim)} total={total}>
      {children}
    </WorksProvider>
  );
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
