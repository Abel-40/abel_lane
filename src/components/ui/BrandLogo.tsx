import { brandIcons } from "@/content/icons";

/** Single-path brand mark from icons.json › brands. `tint` fills with the brand hex (k=d marks use currentColor). */
export function BrandLogo({ name, tint = false }: { name: string; tint?: boolean }) {
  const L = brandIcons[name];
  if (!L) return null;
  return (
    <svg viewBox={L.v} aria-hidden="true" focusable="false">
      <path fill={tint ? (L.k === "d" ? "currentColor" : L.h) : undefined} d={L.d} />
    </svg>
  );
}
