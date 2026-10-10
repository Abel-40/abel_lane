export function Availability({ className = "", children = "Open to remote work" }: { className?: string; children?: React.ReactNode }) {
  return (
    <span className={`avail ${className}`.trim()}>
      <span className="pulse-dot" />
      {children}
    </span>
  );
}
