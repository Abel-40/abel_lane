import { ogContentType, ogSize, renderOg } from "@/lib/og";

export const alt = "Contact Abel Addis";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({ path: "/contact", title: "Let’s build something reliable.", sub: "Open to remote backend, AI systems and freelance work. Usually replies within 24 hours." });
}
