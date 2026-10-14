import { Suspense } from "react";
import WorkHub, { WorkHubFallback, hubMetadata } from "@/components/WorkHub";
import { hubSlugs } from "@/lib/hub";

export async function generateStaticParams() {
  const slugs = await hubSlugs("actress");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }) {
  return hubMetadata("actress", params, searchParams);
}

export default function Page({ params, searchParams }) {
  return (
    <Suspense fallback={<WorkHubFallback />}>
      <WorkHub kind="actress" params={params} searchParams={searchParams} />
    </Suspense>
  );
}
