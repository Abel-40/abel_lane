/** `[01] What I care about ———•` — line draw + pop are animated by the page (data-anim="sec-mark"). */
export function SectionMark({ num, label }: { num: string; label: string }) {
  return (
    <div className="sec-mark" aria-hidden="true">
      <span className="sm-num">{num}</span>
      <span className="sm-label">{label}</span>
      <span className="sm-line">
        <i />
      </span>
    </div>
  );
}
