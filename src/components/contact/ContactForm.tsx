"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { composeMessage, type ContactResponse, TOPICS } from "@/lib/contact-schema";
import { copyText, selectText } from "@/lib/clipboard";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { toast } from "@/lib/ui-store";
import { Icon, MarkupIcon } from "@/components/ui/Icon";

type Done = { kind: "sent" } | { kind: "compose"; message: string; copied: boolean; failed: boolean };
type Field = "name" | "email" | "message";

const NOTE = "I usually reply within 24 hours.";

/**
 * Glass contact form: floating labels, inline validation with a small elastic shake, the send button
 * shrinks into a spinner, then a success panel draws its check. Sends through /api/contact (Resend);
 * without a key it falls back to the reference: compose the message, copy it and offer a mailto link.
 */
export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState(NOTE);
  const [invalid, setInvalid] = useState<Partial<Record<Field, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  useLayoutEffect(() => {
    if (!done || !doneRef.current) return;
    const el = doneRef.current;
    if (!prefersReducedMotion()) {
      gsap.fromTo(Array.from(el.children), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: "power3.out" }); // opacity keeps the heading focusable
    }
    el.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }, [done]);

  const shake = () => {
    if (!prefersReducedMotion() && formRef.current) {
      gsap.fromTo(formRef.current, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, .3)" });
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const fields = (["name", "email", "message"] as Field[]).map((k) => form.elements.namedItem(k) as HTMLInputElement);
    const bad = fields.find((f) => !f.checkValidity());
    if (bad) {
      setInvalid(Object.fromEntries(fields.map((f) => [f.name, !f.checkValidity()])));
      setNote(bad.type === "email" && bad.value ? "Check the email address. It needs an @ and a domain." : "Fill in your name, email and message.");
      bad.focus();
      shake();
      return;
    }
    setInvalid({});
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const message = composeMessage({
      name: data.name,
      email: data.email,
      topic: data.topic as (typeof TOPICS)[number],
      message: data.message,
    });
    setBusy(true);

    /* the send button shrinks into a circular spinner while the request is in flight */
    const send = sendRef.current!;
    const anim = prefersReducedMotion()
      ? null
      : gsap
          .timeline()
          .to(send.querySelector(".send-label"), { autoAlpha: 0, duration: 0.2 })
          .fromTo(send, { width: send.offsetWidth }, { width: 58, duration: 0.5, ease: "power3.inOut" })
          .to(send.querySelector(".spinner"), { opacity: 1, duration: 0.2 });
    const minWait = new Promise((r) => setTimeout(r, prefersReducedMotion() ? 0 : 1500));

    let res: ContactResponse;
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      res = (await r.json()) as ContactResponse;
    } catch {
      res = { ok: false, mode: "compose", reason: "send-failed" };
    }
    await minWait;

    const reset = () => {
      anim?.kill();
      gsap.set([send, send.querySelector(".send-label"), send.querySelector(".spinner")], { clearProps: "all" });
      setBusy(false);
    };

    if (res.mode === "invalid") {
      reset();
      const keys = Object.keys(res.errors) as Field[];
      setInvalid(Object.fromEntries(keys.map((k) => [k, true])));
      setNote(Object.values(res.errors)[0] ?? "Fill in your name, email and message.");
      shake();
      return;
    }
    if (res.mode === "rate-limited") {
      reset();
      setNote(`Too many messages from this connection. Try again in a few minutes, or email ${site.email}.`);
      shake();
      return;
    }
    if (res.mode === "sent") {
      setDone({ kind: "sent" });
      return;
    }
    const copied = await copyText(message);
    setDone({ kind: "compose", message, copied, failed: res.reason === "send-failed" });
  };

  const again = () => {
    formRef.current?.reset();
    setDone(null);
    setBusy(false);
    setNote(NOTE);
    requestAnimationFrame(() => (formRef.current?.elements.namedItem("name") as HTMLInputElement | null)?.focus());
  };

  const describe = (k: Field) => (invalid[k] ? "formNote" : undefined);
  const mailto = done?.kind === "compose"
    ? `mailto:${site.email}?subject=${encodeURIComponent("Portfolio enquiry")}&body=${encodeURIComponent(done.message)}`
    : "";

  return (
    <div className="fcard">
      <form className="form" ref={formRef} noValidate onSubmit={onSubmit} hidden={!!done} aria-describedby="formNote">
        <h2>Tell me about the role or project</h2>
        <p className="note">A few lines is plenty. I’ll reply from {site.email}.</p>
        <div className="row2">
          <div className="fl">
            <input id="f-name" name="name" type="text" placeholder=" " autoComplete="name" required maxLength={120} aria-invalid={invalid.name || undefined} aria-describedby={describe("name")} />
            <label htmlFor="f-name">Your name</label>
          </div>
          <div className="fl">
            <input id="f-email" name="email" type="email" placeholder=" " autoComplete="email" required maxLength={200} aria-invalid={invalid.email || undefined} aria-describedby={describe("email")} />
            <label htmlFor="f-email">Your email</label>
          </div>
        </div>
        <div className="fl fl-select">
          <select id="f-topic" name="topic" defaultValue={TOPICS[0]}>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <label htmlFor="f-topic">What’s this about?</label>
          <Icon name="chev" />
        </div>
        <div className="fl">
          <textarea id="f-msg" name="message" rows={5} placeholder=" " required maxLength={5000} aria-invalid={invalid.message || undefined} aria-describedby={describe("message")} />
          <label htmlFor="f-msg">Message</label>
        </div>
        {/* honeypot: hidden from people and assistive tech */}
        <div className="hp" aria-hidden="true">
          <label htmlFor="f-company">Company</label>
          <input id="f-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <button type="submit" className="send" ref={sendRef} aria-busy={busy}>
          <span className="send-label">
            Send message <MarkupIcon name="send" />
          </span>
          <span className="spinner" aria-hidden="true" />
          {busy && <span className="sr-only">Sending</span>}
        </button>
        <p className="form-note" id="formNote" aria-live="polite">
          {note}
        </p>
      </form>

      {done && (
        <div className="done" ref={doneRef}>
          <svg className="done-check" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="23" />
            <path d="M15 27l7 7 15-15" />
          </svg>
          {done.kind === "sent" ? (
            <>
              <h2 tabIndex={-1}>Your message is on its way</h2>
              <p>Thanks for writing. {NOTE}</p>
              <div className="done-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={again}>
                  Write another
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 tabIndex={-1}>Your message is ready</h2>
              <p>
                {done.failed ? "Sending failed. " : "This form can’t send email yet. "}
                {done.copied
                  ? `Your message is copied, so paste it into an email to ${site.email}.`
                  : `Copy the message below and send it to ${site.email}.`}
              </p>
              <pre>{done.message}</pre>
              <div className="done-actions">
                <a className="btn btn-accent btn-sm" href={mailto}>
                  Open in email app
                </a>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={async (e) => {
                    const pre = e.currentTarget.closest(".done")?.querySelector("pre");
                    if (await copyText(done.message)) toast("Message copied");
                    else {
                      if (pre) selectText(pre);
                      toast("Message selected. Press Ctrl+C to copy it.");
                    }
                  }}
                >
                  Copy message
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={again}>
                  Write another
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
