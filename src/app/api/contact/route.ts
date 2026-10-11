import { Resend } from "resend";
import { site } from "@/content/site";
import { composeMessage, contactSchema, type ContactResponse } from "@/lib/contact-schema";
import { rateLimit } from "@/lib/rate-limit";

const json = (body: ContactResponse, status = 200, headers?: HeadersInit) => Response.json(body, { status, headers });

/**
 * Contact form endpoint. Validates with Zod, drops honeypot submissions, rate-limits per IP and sends with
 * Resend. Without RESEND_API_KEY it answers `mode: "compose"` and the client falls back to the reference
 * behaviour (compose + copy + mailto).
 */
export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return json({ ok: false, mode: "rate-limited", retryAfter: limit.retryAfter }, 429, { "Retry-After": String(limit.retryAfter) });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, mode: "invalid", errors: {} }, 400);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      errors[k] ??= issue.message;
    }
    return json({ ok: false, mode: "invalid", errors }, 400);
  }

  const v = parsed.data;
  // Honeypot filled in: pretend it worked, send nothing.
  if (v.company) return json({ ok: true, mode: "sent" });

  const key = process.env.RESEND_API_KEY;
  if (!key) return json({ ok: false, mode: "compose", reason: "not-configured" });

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "Portfolio <onboarding@resend.dev>",
      to: process.env.CONTACT_TO || site.email,
      replyTo: v.email,
      subject: `Portfolio: ${v.topic} (${v.name})`,
      text: composeMessage(v),
    });
    if (error) {
      console.error("[contact] resend error", error.name);
      return json({ ok: false, mode: "compose", reason: "send-failed" }, 502);
    }
    return json({ ok: true, mode: "sent" });
  } catch (e) {
    console.error("[contact] send failed", (e as Error).message);
    return json({ ok: false, mode: "compose", reason: "send-failed" }, 502);
  }
}
