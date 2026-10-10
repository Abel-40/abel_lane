import { pad2 } from "@/lib/motion";

/** Numbered flow pills joined by animated wires (reference flowHTML). */
export function FlowPills({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="flow">
      {steps.map((t, i) => (
        <li key={t}>
          <span className="fp">
            <i>{pad2(i + 1)}</i>
            {t}
          </span>
          {i < steps.length - 1 && (
            <span className="fw" style={{ "--d": `${(i * 0.35).toFixed(2)}s` } as React.CSSProperties} aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}
