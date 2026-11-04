import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Projects by Abel Addis";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ path: "/projects", title: "Five products, each built around a real problem.", sub: "Insight Stream, MoodVerse, SEO Maker, AlertChain and Workroom." });
}
