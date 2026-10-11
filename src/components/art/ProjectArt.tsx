/* Project illustrations, converted from the reference <template id="art-*"> SVGs (simple shapes + --art-*
   tokens, so they flip with the theme). Converted once from reference/index.html; edit here. */

import type { ArtKey } from "@/content/types";

function InsightArt() {
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    <rect className="k-card" x="24" y="24" width="214" height="46" rx="11"/><rect className="k-soft" x="38" y="36" width="40" height="9" rx="4.5"/><rect className="k-bar" x="38" y="52" width="150" height="6" rx="3"/><circle className="k-ok a-blink" cx="220" cy="47" r="6"/>
    <rect className="k-card" x="24" y="80" width="214" height="46" rx="11"/><rect className="k-warnsoft" x="38" y="92" width="30" height="9" rx="4.5"/><rect className="k-bar" x="38" y="108" width="122" height="6" rx="3"/><circle className="k-warn a-blink d1" cx="220" cy="103" r="6"/>
    <rect className="k-card" x="24" y="136" width="214" height="46" rx="11"/><rect className="k-soft" x="38" y="148" width="48" height="9" rx="4.5"/><rect className="k-bar" x="38" y="164" width="136" height="6" rx="3"/><circle className="k-muted a-blink d2" cx="220" cy="159" r="6"/>
    <rect className="k-card" x="24" y="190" width="214" height="22" rx="11"/><circle className="k-ln-acc" cx="40" cy="200" r="5"/><path className="k-ln-acc" d="M44 204l4 4"/><rect className="k-bar" x="56" y="198" width="96" height="6" rx="3"/>
    <rect className="k-card" x="254" y="24" width="122" height="188" rx="13"/><rect className="k-soft" x="268" y="38" width="56" height="8" rx="4"/>
    <rect className="k-soft" x="270" y="156" width="12" height="40" rx="4"/><rect className="k-mid" x="288" y="134" width="12" height="62" rx="4"/><rect className="k-soft" x="306" y="146" width="12" height="50" rx="4"/><rect className="k-mid2" x="324" y="112" width="12" height="84" rx="4"/><rect className="k-acc" x="342" y="90" width="12" height="106" rx="4"/>
    <polyline className="k-ln-acc2 a-draw" points="276,140 294,118 312,130 330,96 348,72" pathLength="100"/><circle className="k-acc2" cx="348" cy="72" r="4"/>
    </svg>
  );
}

function MoodArt() {
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    <path className="k-card" d="M30 34 H180 A14 14 0 0 1 194 48 V96 A14 14 0 0 1 180 110 H70 L50 128 V110 H30 A14 14 0 0 1 16 96 V48 A14 14 0 0 1 30 34 Z"/>
    <rect className="k-bar" x="30" y="52" width="128" height="7" rx="3.5"/><rect className="k-bar" x="30" y="68" width="146" height="7" rx="3.5"/><rect className="k-bar" x="30" y="84" width="92" height="7" rx="3.5"/>
    <rect className="k-chip" x="16" y="146" width="76" height="22" rx="11"/><circle className="k-acc" cx="28" cy="157" r="4"/><rect className="k-mid" x="37" y="154" width="44" height="6" rx="3"/>
    <rect className="k-chip" x="98" y="146" width="64" height="22" rx="11"/><circle className="k-acc2" cx="110" cy="157" r="4"/><rect className="k-mid" x="119" y="154" width="32" height="6" rx="3"/>
    <path className="k-ln-acc a-dash" d="M204 100 H236"/><path className="k-ln-acc" d="M230 94 L237 100 L230 106"/>
    <path className="k-acc2 a-float" d="M220 58 l2.6 7.4 7.4 2.6 -7.4 2.6 -2.6 7.4 -2.6 -7.4 -7.4 -2.6 7.4 -2.6 z"/>
    <g className="a-float d1">
    <rect className="k-card" x="248" y="24" width="132" height="172" rx="14"/><rect className="k-mid" x="262" y="40" width="54" height="8" rx="4"/><path className="k-acc" d="M356 24 V48 L348 42 L340 48 V24 Z"/>
    <rect className="k-bar" x="262" y="62" width="104" height="6" rx="3"/><rect className="k-bar" x="262" y="76" width="96" height="6" rx="3"/><rect className="k-bar" x="262" y="90" width="108" height="6" rx="3"/><rect className="k-bar" x="262" y="104" width="84" height="6" rx="3"/><rect className="k-bar" x="262" y="118" width="70" height="6" rx="3"/>
    <rect className="k-soft" x="262" y="168" width="74" height="18" rx="9"/><rect className="k-mid" x="272" y="174" width="54" height="6" rx="3"/>
    <circle className="k-ok" cx="362" cy="177" r="10"/><path className="k-ln-on" d="M357 177 l3.5 3.5 6.5 -7"/>
    </g>
    </svg>
  );
}

function SeoArt() {
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    <rect className="k-acc2 a-scan" x="8" y="12" width="384" height="2" rx="1" opacity=".4"/>
    <path className="k-ln-mid" d="M200 52 V72 H92 V94 M200 72 V94 M200 72 H308 V94"/>
    <path className="k-ln-mid" d="M92 122 V138 H52 V154 M92 138 H132 V154 M308 122 V138 H280 V154 M308 138 H360 V154"/>
    <rect className="k-acc" x="168" y="22" width="64" height="30" rx="9"/><rect className="k-whitetext" x="180" y="34" width="40" height="6" rx="3" opacity=".75"/>
    <rect className="k-card" x="60" y="94" width="64" height="28" rx="8"/><rect className="k-bar" x="72" y="105" width="40" height="6" rx="3"/>
    <rect className="k-card" x="168" y="94" width="64" height="28" rx="8"/><rect className="k-bar" x="180" y="105" width="40" height="6" rx="3"/>
    <rect className="k-card" x="276" y="94" width="64" height="28" rx="8"/><rect className="k-bar" x="288" y="105" width="40" height="6" rx="3"/>
    <rect className="k-card" x="24" y="154" width="56" height="26" rx="8"/><rect className="k-bar" x="34" y="164" width="34" height="6" rx="3"/>
    <rect className="k-card" x="104" y="154" width="56" height="26" rx="8"/><rect className="k-bar" x="114" y="164" width="34" height="6" rx="3"/>
    <rect className="k-card" x="252" y="154" width="56" height="26" rx="8"/><rect className="k-bar" x="262" y="164" width="34" height="6" rx="3"/>
    <rect className="k-card" x="332" y="154" width="56" height="26" rx="8"/><rect className="k-bar" x="342" y="164" width="34" height="6" rx="3"/>
    <circle className="k-ok" cx="124" cy="94" r="8"/><path className="k-ln-on" d="M120 94 l2.8 2.8 5 -5.4"/>
    <circle className="k-ln-warn a-ring" cx="232" cy="94" r="8"/><circle className="k-warn" cx="232" cy="94" r="8"/><path className="k-ln-on" d="M232 90 v4.5"/><circle className="k-whitetext" cx="232" cy="98.2" r="1.2"/>
    <circle className="k-ok" cx="340" cy="94" r="8"/><path className="k-ln-on" d="M336 94 l2.8 2.8 5 -5.4"/>
    <circle className="k-warn" cx="80" cy="154" r="7"/><path className="k-ln-on" d="M80 150.5 v4"/>
    <circle className="k-ok" cx="160" cy="154" r="7"/><circle className="k-ok" cx="308" cy="154" r="7"/>
    <rect className="k-bar" x="24" y="196" width="352" height="10" rx="5"/><rect className="k-acc a-fill" x="24" y="196" width="250" height="10" rx="5"/>
    </svg>
  );
}

function AlertArt() {
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    <rect className="k-card" x="16" y="16" width="368" height="188" rx="14"/>
    <path className="k-grid" d="M32 104 H368 M32 148 H368 M32 188 H368"/>
    <polygon className="k-fade" points="32,176 66,156 100,164 134,134 168,144 202,118 236,124 266,98 288,86 316,72 344,78 368,64 368,188 32,188"/>
    <path className="k-ln-warn" d="M32 84 H368" strokeDasharray="5 5"/>
    <rect className="k-warnsoft" x="316" y="90" width="48" height="16" rx="8"/><text className="k-tag" x="340" y="101" textAnchor="middle">ABOVE</text>
    <polyline className="k-ln-acc a-draw" points="32,176 66,156 100,164 134,134 168,144 202,118 236,124 266,98 288,86 316,72 344,78 368,64" pathLength="100" strokeWidth="2.2"/>
    <circle className="k-ln-acc a-ring" cx="292" cy="84" r="5"/><circle className="k-acc" cx="292" cy="84" r="5"/>
    <g className="a-drop">
    <rect className="k-inkbox" x="32" y="28" width="160" height="40" rx="10"/>
    <path className="k-ln-ink" d="M46 53 h12 l-1.6 -2.2 v-5 a4.4 4.4 0 0 0 -8.8 0 v5 z"/>
    <text className="k-inktext" x="68" y="45">Price target crossed</text>
    <text className="k-inksub" x="68" y="59">Email + in-app sent</text>
    </g>
    </svg>
  );
}

function WorkArt() {
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    <rect className="k-soft" x="20" y="20" width="112" height="184" rx="12" opacity=".7"/><rect className="k-soft" x="144" y="20" width="112" height="184" rx="12" opacity=".7"/><rect className="k-soft" x="268" y="20" width="112" height="184" rx="12" opacity=".7"/>
    <rect className="k-mid" x="32" y="32" width="44" height="7" rx="3.5"/><rect className="k-mid" x="156" y="32" width="56" height="7" rx="3.5"/><rect className="k-mid" x="280" y="32" width="36" height="7" rx="3.5"/>
    <rect className="k-card" x="30" y="50" width="92" height="34" rx="8"/><rect className="k-bar" x="40" y="60" width="56" height="5" rx="2.5"/><circle className="k-soft" cx="110" cy="74" r="5"/>
    <rect className="k-card" x="30" y="92" width="92" height="34" rx="8"/><rect className="k-bar" x="40" y="102" width="64" height="5" rx="2.5"/><circle className="k-mid" cx="110" cy="116" r="5"/>
    <rect className="k-card" x="30" y="134" width="92" height="34" rx="8"/><rect className="k-bar" x="40" y="144" width="48" height="5" rx="2.5"/>
    <g className="a-float"><rect className="k-acc" x="154" y="50" width="92" height="34" rx="8"/><rect className="k-whitetext" x="164" y="60" width="58" height="5" rx="2.5" opacity=".8"/><circle className="k-whitetext" cx="234" cy="74" r="5" opacity=".85"/></g>
    <rect className="k-card" x="154" y="92" width="92" height="34" rx="8"/><rect className="k-bar" x="164" y="102" width="52" height="5" rx="2.5"/>
    <rect className="k-card" x="154" y="134" width="92" height="34" rx="8"/><rect className="k-soft" x="162" y="142" width="22" height="14" rx="7"/><text className="k-ai" x="173" y="152" textAnchor="middle">AI</text><rect className="k-bar" x="190" y="146" width="44" height="5" rx="2.5"/>
    <rect className="k-card" x="278" y="50" width="92" height="34" rx="8"/><rect className="k-bar" x="288" y="60" width="48" height="5" rx="2.5"/><rect className="k-inkbox" x="350" y="64" width="12" height="10" rx="2"/><path className="k-ln-lock" d="M352 64 v-3 a4 4 0 0 1 8 0 v3"/>
    <rect className="k-card" x="278" y="92" width="92" height="34" rx="8"/><rect className="k-bar" x="288" y="102" width="60" height="5" rx="2.5"/><circle className="k-soft" cx="358" cy="116" r="5"/>
    </svg>
  );
}

const ARTS: Record<ArtKey, () => React.JSX.Element> = {
  insight: InsightArt,
  mood: MoodArt,
  seo: SeoArt,
  alert: AlertArt,
  work: WorkArt,
};

/** `.art` wrapper; the hosting card positions it. */
export function ProjectArt({ art, className = "art" }: { art: ArtKey; className?: string }) {
  const A = ARTS[art];
  return (
    <span className={className} data-art={art}>
      <A />
    </span>
  );
}
