import VideoCatalogPage from "@/components/VideoCatalogPage";

// 絞り込み条件ごとにURLが増える検索ページは、検索エンジンに載せない
export const metadata = {
  title: "動画作品を探す",
  robots: { index: false, follow: true },
};

export default function VideoSearchPage() {
  return <VideoCatalogPage mode="search" />;
}
