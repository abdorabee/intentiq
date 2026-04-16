import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/memory/", "/pipeline/", "/people/", "/history/", "/watchlist/", "/billing/", "/api-keys/"],
      },
    ],
    sitemap: "https://www.intentiqs.com/sitemap.xml",
  };
}
