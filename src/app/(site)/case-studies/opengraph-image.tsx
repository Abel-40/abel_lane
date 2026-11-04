import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Case studies by Abel Addis";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ path: "/case-studies", title: "The decisions behind the code.", sub: "What I tried, what I rejected, and why." });
}
