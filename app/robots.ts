import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/carrito", "/pedido/", "/api/"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
