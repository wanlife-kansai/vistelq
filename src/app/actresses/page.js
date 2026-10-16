import { Suspense } from "react";
import ActressesClient from "@/components/ActressesClient";
import { getActressImages } from "@/lib/actress-profile";

export const metadata = {
  title: "AV女優一覧",
  description: "女優ごとの出演作品を一覧で探せます。",
  alternates: { canonical: "/actresses" },
};

async function ActressesContent() {
  const images = await getActressImages();
  return <ActressesClient images={images} />;
}

export default function ActressesPage() {
  return (
    <Suspense fallback={<ActressesClient />}>
      <ActressesContent />
    </Suspense>
  );
}
