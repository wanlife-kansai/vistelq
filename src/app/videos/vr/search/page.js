import VideoCatalogPage from "@/components/VideoCatalogPage";

// 絞り込み条件ごとにURLが増える検索ページは、検索エンジンに載せない
export const metadata = {
  title: "VR動画を探す",
  robots: { index: false, follow: true },
};

export default function VrSearchPage() {
  return <VideoCatalogPage mode="vr" />;
}
