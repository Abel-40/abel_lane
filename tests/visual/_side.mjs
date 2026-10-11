// Side-by-side montage of <id>-ref.jpg | <id>-new.jpg (optionally scaled) for quick review.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const [id, scale = "0.5"] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage();
const r = readFileSync(`qa/compare/${id}-ref.jpg`).toString("base64"), n = readFileSync(`qa/compare/${id}-new.jpg`).toString("base64");
await p.setContent(`<body style="margin:0;background:#888;display:flex;gap:8px"><img id=a src="data:image/jpeg;base64,${r}" style="zoom:${scale}"><img id=b src="data:image/jpeg;base64,${n}" style="zoom:${scale}"></body>`);
await p.waitForFunction(() => document.getElementById("b").complete && document.getElementById("a").complete);
const w = await p.evaluate(() => document.body.scrollWidth), h = await p.evaluate(() => document.body.scrollHeight);
await p.setViewportSize({ width: w, height: h });
await p.screenshot({ path: `qa/compare/${id}-side.jpg`, quality: 70 });
await b.close();
