import { getWorks } from "@/lib/works-db";
import { absoluteUrl } from "@/lib/site-url";
import {
  actressHref,
  genreHref,
  getActressList,
  getGenreList,
} from "@/lib/work-relations";

const MAX_URLS = 5000;

export default async function sitemap() {
  const works = await getWorks();

  const fixed = [
    ["/", 1.0, "daily"],
    ["/videos", 0.9, "daily"],
    ["/videos/new", 0.8, "daily"],
    ["/videos/vr", 0.8, "daily"],
    ["/rankings", 0.8, "daily"],
    ["/actresses", 0.7, "weekly"],
    ["/goods", 0.6, "weekly"],
  ].map(([path, priority, changeFrequency]) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));

  const actressSlugs = new Set();
  const genreSlugs = new Set();

  const workEntries = works.map((work) => {
    getActressList(work).forEach((item) => actressSlugs.add(item.slug));
    getGenreList(work).forEach((item) => genreSlugs.add(item.slug));

    const released = work.releaseDate ? new Date(work.releaseDate) : null;

    return {
      url: absoluteUrl(`/works/${encodeURIComponent(work.id)}`),
      lastModified:
        released && !Number.isNaN(released.getTime()) ? released : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    };
  });

  const hubEntries = [
    ...[...actressSlugs].map((slug) => ({
      url: absoluteUrl(actressHref(slug)),
      changeFrequency: "weekly",
      priority: 0.5,
    })),
    ...[...genreSlugs].map((slug) => ({
      url: absoluteUrl(genreHref(slug)),
      changeFrequency: "weekly",
      priority: 0.5,
    })),
  ];

  return [...fixed, ...hubEntries, ...workEntries].slice(0, MAX_URLS);
}
