import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/* Shared Open Graph card in the site's language: sky canvas, accent glow, condensed navy headline,
   a mono "GET /path 200 OK" line and the AB monogram. Fonts are bundled static TTFs (assets/og). */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const font = (f: string) => readFile(join(process.cwd(), "assets/og", f));

export async function renderOg({ path, title, sub }: { path: string; title: string; sub: string }) {
  const [display, sans, sansBold, mono, script] = await Promise.all([
    font("bricolage-800-75.ttf"),
    font("instrument-sans-400.ttf"),
    font("instrument-sans-600.ttf"),
    font("jetbrains-mono-500.ttf"),
    font("great-vibes.ttf"),
  ]);
  const size = title.length > 46 ? 76 : title.length > 30 ? 92 : 112;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#EDF3FC",
          backgroundImage:
            "radial-gradient(900px 640px at 92% -8%, rgba(120,175,255,.55), rgba(120,175,255,0) 62%), radial-gradient(760px 560px at -12% 60%, rgba(130,215,255,.35), rgba(130,215,255,0) 62%)",
          fontFamily: "Instrument Sans",
          color: "#0A1838",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #1E66F5 0%, #2C8BF2 55%, #13A0E0 100%)",
              color: "#FFFFFF",
              fontFamily: "Great Vibes",
              fontSize: 38,
              letterSpacing: -3,
            }}
          >
            AB
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>Abel Addis</div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: "JetBrains Mono",
              fontSize: 26,
              color: "#33456A",
            }}
          >
            <span style={{ padding: "6px 12px", borderRadius: 10, background: "#0A1838", color: "#EDF3FC" }}>GET</span>
            <span>{path}</span>
            <span style={{ color: "#0B7A43" }}>200 OK</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Bricolage Grotesque",
              fontSize: size,
              lineHeight: 0.94,
              letterSpacing: -3,
              color: "#0A1838",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#33456A", maxWidth: 960, lineHeight: 1.35 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, fontWeight: 600, color: "#1652CC" }}>
          <div style={{ width: 12, height: 12, borderRadius: 12, background: "#0E9F57" }} />
          Backend engineer, AI systems · Ethiopia (UTC+3)
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Bricolage Grotesque", data: display, weight: 800, style: "normal" },
        { name: "Instrument Sans", data: sans, weight: 400, style: "normal" },
        { name: "Instrument Sans", data: sansBold, weight: 600, style: "normal" },
        { name: "JetBrains Mono", data: mono, weight: 500, style: "normal" },
        { name: "Great Vibes", data: script, weight: 400, style: "normal" },
      ],
    },
  );
}
