import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The "AB" brand mark (Great Vibes on the blue→cyan rounded square). */
export async function markImage(px: number, radius: number) {
  const script = await readFile(join(process.cwd(), "assets/og/great-vibes.ttf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius,
          background: "linear-gradient(135deg, #1E66F5 0%, #2C8BF2 55%, #13A0E0 100%)",
          color: "#FFFFFF",
          fontFamily: "Great Vibes",
          fontSize: px * 0.5,
          letterSpacing: -px * 0.05,
          paddingTop: px * 0.06,
        }}
      >
        AB
      </div>
    ),
    { width: px, height: px, fonts: [{ name: "Great Vibes", data: script, weight: 400, style: "normal" }] },
  );
}

export default function Icon() {
  return markImage(64, 20);
}
