import type { MetadataRoute } from "next";

// Installable, so a phone can keep it on the home screen and launch it without browser
// chrome. Zero friction was the whole point of shipping this on the web rather than a
// store — an icon on the home screen is as close as that gets.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rainbow Racer — L'Ascension",
    short_name: "Rainbow Racer",
    description:
      "Accroche-toi aux prismes, balance-toi, lâche au bon moment. Grimpe avant que l'orage ne te rattrape.",
    start_url: "/",
    display: "fullscreen",
    orientation: "portrait",
    background_color: "#0d0b1c",
    theme_color: "#0d0b1c",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
