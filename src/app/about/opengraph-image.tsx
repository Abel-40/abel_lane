import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "About Abel Addis";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ path: "/about", title: "From UI/UX to the systems behind products.", sub: "Backend services and AI-integrated systems: APIs, async workers, pipelines, semantic search and RAG." });
}
