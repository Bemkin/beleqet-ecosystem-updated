import type { MetadataRoute } from "next";
import { getSeoConfig } from "@/lib/seo/config";
import { INDEXABLE_ROUTES, ROUTE_REGISTRY } from "@/lib/seo/route-registry";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/**
 * Dynamic sitemap generation.
 *
 * **Static routes** — enumerated from `route-registry.ts` so that adding a new
 * public page automatically includes it in the sitemap.
 *
 * **Dynamic routes** — fetched from the NestJS backend at build / ISR time.
 * Currently only `/jobs/[id]` is dynamic; the pattern can be extended for
 * other resources (freelance gigs, categories, etc.) by adding more fetchers.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl } = getSeoConfig();
  const base = siteUrl.replace(/\/+$/, "");

  const entries: MetadataRoute.Sitemap = [];

  // ── Static routes ──────────────────────────────────────────────────────
  for (const route of INDEXABLE_ROUTES) {
    if (route.pattern.includes("[") && route.pattern.includes("]")) {
      continue; // dynamic patterns are handled below
    }
    entries.push({
      url: `${base}${route.pattern}`,
      lastModified: new Date(),
      changeFrequency: route.changefreq,
      priority: route.priority,
    });
  }

  // ── Dynamic: jobs ──────────────────────────────────────────────────────
  try {
    const response = await fetch(
      `${API_URL.replace(/\/+$/, "")}/jobs?limit=1000`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (response.ok) {
      const body: { items?: { id: string; createdAt?: string }[] } =
        await response.json();
      const items = body.items ?? [];

      for (const job of items) {
        entries.push({
          url: `${base}/jobs/${job.id}`,
          lastModified: job.createdAt
            ? new Date(job.createdAt)
            : new Date(),
          changeFrequency: ROUTE_REGISTRY.JOB_DETAIL.changefreq,
          priority: ROUTE_REGISTRY.JOB_DETAIL.priority,
        });
      }
    }
  } catch {
    // If the backend is unavailable during build, emit only static routes.
  }

  return entries;
}
