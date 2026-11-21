import type { MetadataRoute } from "next";
import { t, locale } from "@/i18n";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${t.app.name} – ${t.app.fullName}`,
    short_name: t.app.name,
    description: t.app.description,
    lang: locale,
    start_url: "/hjem",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#070b13",
    theme_color: "#070b13",
    categories: ["health", "fitness", "sports"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
