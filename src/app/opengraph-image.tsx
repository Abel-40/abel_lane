import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Abel Addis, backend engineer building the systems behind AI products";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ path: "/", title: "I build the systems behind AI products.", sub: "Typed APIs, async workers, data pipelines and retrieval, shipped with FastAPI, Django and PostgreSQL." });
}
