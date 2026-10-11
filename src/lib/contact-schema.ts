import { z } from "zod";

export const TOPICS = ["A remote backend role", "An AI systems role", "A freelance project", "Something else"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Fill in your name.").max(120),
  email: z.email("Check the email address. It needs an @ and a domain.").max(200),
  topic: z.enum(TOPICS),
  message: z.string().trim().min(1, "Write a short message.").max(5000),
  /** Honeypot: real people never see or fill this field. */
  company: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** The reference's composed message (used for copy/mailto when the form can't send). */
export function composeMessage(v: Pick<ContactInput, "name" | "email" | "topic" | "message">) {
  return `From: ${v.name.trim()} <${v.email.trim()}>\nAbout: ${v.topic}\n\n${v.message.trim()}`;
}

export type ContactResponse =
  | { ok: true; mode: "sent" }
  | { ok: false; mode: "compose"; reason: "not-configured" | "send-failed" }
  | { ok: false; mode: "invalid"; errors: Partial<Record<keyof ContactInput, string>> }
  | { ok: false; mode: "rate-limited"; retryAfter: number };
