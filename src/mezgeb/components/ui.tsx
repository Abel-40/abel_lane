"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { formatMinor, parseAmount, parseSignedAmount, type FormatOptions, type Minor } from "../lib/money";
import { AlertIcon, BackIcon, CloseIcon } from "./Icons";

/* ── Headers ── */

export function BackHeader({ title, subtitle, href = "/mezgeb", action }: { title: string; subtitle?: string; href?: string; action?: ReactNode }) {
  return (
    <header className="mz-head mz-head--back">
      <Link href={href} aria-label="Back" className="mz-icon-btn">
        <BackIcon />
      </Link>
      <div className="mz-head__text mz-grow">
        <h1 className="mz-title mz-title--sm">{title}</h1>
        {subtitle && <span className="mz-subtitle">{subtitle}</span>}
      </div>
      {action}
    </header>
  );
}

export function ErrorLine({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  return (
    <p className="mz-error" role="alert">
      <AlertIcon />
      <span>{text}</span>
    </p>
  );
}

/* ── Sheet (bottom drawer / full screen) ── */

export function Sheet({
  open,
  title,
  onClose,
  full,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  full?: boolean;
  children: ReactNode;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useLayoutEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const body = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = ref.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])");
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = body;
      window.removeEventListener("keydown", onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="mz-sheet-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`mz-sheet${full ? " mz-sheet--full" : ""}`}>
        <div className="mz-head">
          <h2 id={titleId} className="mz-title mz-title--sm">
            {title}
          </h2>
          <button type="button" className="mz-icon-btn" aria-label="Close" data-close onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Toasts ── */

type Toast = { id: number; text: string; warn?: boolean };
const ToastCtx = createContext<(text: string, warn?: boolean) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const show = useCallback((text: string, warn?: boolean) => setToast({ id: Date.now(), text, warn }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), toast.warn ? 5000 : 2600);
    return () => window.clearTimeout(t);
  }, [toast]);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" role="status">
        {toast && (
          <div key={toast.id} className={`mz-toast${toast.warn ? " mz-toast--warn" : ""}`}>
            {toast.warn && <AlertIcon />}
            {toast.text}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

/* ── Money with privacy ── */

const PrivacyCtx = createContext<{ hideAll: boolean }>({ hideAll: false });

export function PrivacyProvider({ hideAll, children }: { hideAll: boolean; children: ReactNode }) {
  return <PrivacyCtx.Provider value={{ hideAll }}>{children}</PrivacyCtx.Provider>;
}

/**
 * An amount. Protected amounts show ••••• until tapped; with "hide balances"
 * on, every amount is blurred until tapped.
 */
export function Money({
  minor,
  currency = "ETB",
  protect = false,
  className,
  ...opts
}: { minor: Minor; currency?: string; protect?: boolean; className?: string } & FormatOptions) {
  const { hideAll } = useContext(PrivacyCtx);
  const [shown, setShown] = useState(false);
  const text = formatMinor(minor, currency, opts);
  // A span with role=button (not <button>) so it can sit inside links and row
  // buttons; the first tap reveals without following the link.
  const toggle = (e: React.SyntheticEvent, next: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setShown(next);
  };
  const keys = (next: boolean) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") toggle(e, next);
  };
  if (protect && !shown) {
    return (
      <span role="button" tabIndex={0} className="mz-reveal" aria-label="Reveal balance" onClick={(e) => toggle(e, true)} onKeyDown={keys(true)} style={{ display: "inline-flex", alignItems: "center" }}>
        •••••
      </span>
    );
  }
  if (hideAll && !protect) {
    return (
      <span
        role="button"
        tabIndex={0}
        className={`mz-money-btn ${className ?? ""}`}
        aria-label={shown ? `${text}, tap to hide` : "Hidden amount, tap to show"}
        onClick={(e) => toggle(e, !shown)}
        onKeyDown={keys(!shown)}
      >
        <span className={shown ? undefined : "mz-money--blur"} aria-hidden={!shown}>
          {text}
        </span>
      </span>
    );
  }
  return <span className={className}>{text}</span>;
}

/* ── Form fields ── */

export function TextField({
  label,
  value,
  onChange,
  hint,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="mz-field">
      {label}
      <input className="mz-input" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      {hint && <span className="mz-field__hint">{hint}</span>}
    </label>
  );
}

/** A money input that keeps the typed text and reports minor units (null when invalid). */
export function AmountField({
  label,
  value,
  onChange,
  hint,
  signed,
  currency = "ETB",
  required,
}: {
  label: string;
  value: string;
  onChange: (text: string, minor: Minor | null) => void;
  hint?: string;
  signed?: boolean;
  currency?: string;
  required?: boolean;
}) {
  const parsed = value.trim() === "" ? null : signed ? parseSignedAmount(value) : parseAmount(value);
  const invalid = value.trim() !== "" && parsed === null;
  return (
    <label className="mz-field">
      {label}
      <input
        className="mz-input mz-input--num"
        inputMode="decimal"
        autoComplete="off"
        required={required}
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(e) => {
          const t = e.target.value;
          onChange(t, t.trim() === "" ? null : signed ? parseSignedAmount(t) : parseAmount(t));
        }}
      />
      {invalid ? (
        <span className="mz-field__hint mz-warn">Use digits, with up to two decimals.</span>
      ) : (
        (hint || (parsed !== null && parsed >= 100000)) && (
          <span className="mz-field__hint">
            {parsed !== null && parsed >= 100000 ? `${formatMinor(parsed, currency)}${hint ? " · " + hint : ""}` : hint}
          </span>
        )
      )}
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
}) {
  return (
    <label className="mz-field">
      {label}
      <select className="mz-select" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="mz-field__hint">{hint}</span>}
    </label>
  );
}

export function SwitchRow({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="mz-stack" style={{ gap: 2 }}>
      <div className="mz-check-row">
        <span id={id}>{label}</span>
        <button type="button" role="switch" aria-checked={checked} aria-labelledby={id} className="mz-switch" onClick={() => onChange(!checked)}>
          {checked ? "Yes" : "No"}
        </button>
      </div>
      {hint && <span className="mz-field__hint">{hint}</span>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="mz-tabs" style={{ ["--tabs" as string]: options.length }}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ percent, color, size, label }: { percent: number; color?: string; size?: 6 | 8 | 10; label: string }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={`mz-bar${size === 10 ? " mz-bar--10" : size === 6 ? " mz-bar--6" : ""}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={p}
    >
      <span style={{ width: `${p}%`, ["--bar" as string]: color }} />
    </div>
  );
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <main className="mz-center" aria-busy="true">
      <span className="mz-spinner" aria-hidden="true" />
      <span className="mz-sr-only">{label}</span>
    </main>
  );
}

/** Shown while data loads, or when loading failed. */
export function DataFallback({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  if (!error) return <Loading />;
  return (
    <main className="mz-center">
      <ErrorLine text={error} />
      <button type="button" className="mz-btn mz-btn--sm mz-btn--secondary" onClick={onRetry}>
        Try again
      </button>
      <p className="mz-note" style={{ maxWidth: 300 }}>
        If this keeps happening, the free database may be paused after a week without use. Open the Supabase dashboard to restore it.
      </p>
    </main>
  );
}

/** Form footer: primary save button plus optional archive / delete. */
export function FormActions({
  saving,
  saveLabel = "Save",
  onArchive,
  archiveLabel = "Archive",
  onDelete,
  disabled,
}: {
  saving?: boolean;
  saveLabel?: string;
  onArchive?: () => void;
  archiveLabel?: string;
  onDelete?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mz-stack">
      <button type="submit" className="mz-btn" disabled={saving || disabled}>
        {saving ? "Saving…" : saveLabel}
      </button>
      {(onArchive || onDelete) && (
        <div className={onArchive && onDelete ? "mz-grid-2" : undefined}>
          {onArchive && (
            <button type="button" className="mz-btn mz-btn--md mz-btn--dark" onClick={onArchive} disabled={saving}>
              {archiveLabel}
            </button>
          )}
          {onDelete && (
            <button type="button" className="mz-btn mz-btn--md mz-btn--amber-quiet" onClick={onDelete} disabled={saving}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
