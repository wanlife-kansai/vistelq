import { Suspense } from "react";
import VideosPage from "@/components/VideosPage";
import { getActressImages } from "@/lib/actress-profile";

async function Content({ mode }) {
  const images = await getActressImages();
  return <VideosPage mode={mode} actressImages={images} />;
}

// 女優画像（DB）を取得してから表示。取得中・失敗時は画像なしで表示する。
export default function VideosPageWithImages({ mode = "normal" }) {
  return (
    <Suspense fallback={<VideosPage mode={mode} />}>
      <Content mode={mode} />
    </Suspense>
  );
}
