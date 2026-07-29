import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sustainly Green",
    short_name: "Sustainly Green",
    description:
      "B2B marketplace for sustainable products, verified suppliers, and responsible sourcing.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9f8",
    theme_color: "#0b3d24",
    icons: [
      {
        src: "/favi.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
