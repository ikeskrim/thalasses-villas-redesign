/**
 * The icon set. Drawn for this project — no stock library, no emoji, no fills.
 *
 * Rules: 24px grid, 1.5px stroke, round caps and joins, single ink taken from
 * `currentColor` so an icon is basalt on limestone and limestone on pelagos
 * without a second definition. Shapes come from the place — a gate, a wave, a
 * pool ladder, a rotor, a table, a leaf, a key, a bed.
 *
 * They exist to help a card scan, never to carry meaning on their own: every
 * icon sits beside a real title, and all are aria-hidden.
 */

export type IconName =
  | "gate"
  | "wave"
  | "pool"
  | "rotor"
  | "table"
  | "leaf"
  | "key"
  | "bed"
  | "car"
  | "broom"
  | "bell"
  | "rings"
  | "anchor";

const S = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  focusable: "false" as const,
};

const PATHS: Record<IconName, React.ReactNode> = {
  // two posts and a barred leaf — the estate gate
  gate: (
    <>
      <path d="M3 20V6M21 20V6" />
      <path d="M6 20V9h12v11" />
      <path d="M6 13h12M12 9v11" />
    </>
  ),
  // the waterline
  wave: (
    <>
      <path d="M2 10c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
      <path d="M2 15c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
    </>
  ),
  // pool edge with a ladder
  pool: (
    <>
      <path d="M3 18c2 0 2 1.6 4 1.6s2-1.6 4-1.6 2 1.6 4 1.6 2-1.6 4-1.6" />
      <path d="M8 15V6a2 2 0 0 1 4 0M15 15V6a2 2 0 0 1 4 0" />
      <path d="M8 10h4M15 10h4" />
    </>
  ),
  // rotor over a landing mark
  rotor: (
    <>
      <path d="M3 5h18" />
      <path d="M12 5v4" />
      <circle cx="12" cy="15" r="5" />
      <path d="M10 13v4M14 13v4M10 15h4" />
    </>
  ),
  // the long table
  table: (
    <>
      <path d="M2 9h20" />
      <path d="M4 9v11M20 9v11" />
      <path d="M7 5v4M12 5v4M17 5v4" />
    </>
  ),
  // garden leaf
  leaf: (
    <>
      <path d="M5 19c0-8 5-13 14-14 1 9-4 14-11 14H5Z" />
      <path d="M9 19c1-5 3.5-8 7-10" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l9 9M17 17l2-2M15 15l1.5-1.5" />
    </>
  ),
  bed: (
    <>
      <path d="M3 18v-8M3 14h18v4" />
      <path d="M21 18v-5a3 3 0 0 0-3-3H9v4" />
      <circle cx="6.5" cy="11.5" r="1.5" />
    </>
  ),
  car: (
    <>
      <path d="M4 16h16" />
      <path d="M5 16v2M19 16v2" />
      <path d="M4 16l1.5-5A2 2 0 0 1 7.4 9.6h9.2a2 2 0 0 1 1.9 1.4L20 16" />
      <circle cx="8" cy="16" r="1.4" />
      <circle cx="16" cy="16" r="1.4" />
    </>
  ),
  broom: (
    <>
      <path d="M14 4l-7 7" />
      <path d="M6 12l6 6" />
      <path d="M5 13l-2 6 6-2" />
      <path d="M13 19l6-6-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 17h12" />
      <path d="M7 17v-4a5 5 0 0 1 10 0v4" />
      <path d="M12 5V3.5" />
      <path d="M11 20h2" />
    </>
  ),
  anchor: (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v13" />
      <path d="M8 10h8" />
      <path d="M4 14a8 8 0 0 0 16 0" />
      <path d="M4 14h2M18 14h2" />
    </>
  ),
  rings: (
    <>
      <circle cx="9" cy="14" r="5" />
      <circle cx="15" cy="14" r="5" />
      <path d="M12 5l-2 3h4l-2-3Z" />
    </>
  ),
};

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg {...S} className={`icon ${className}`}>
      {PATHS[name]}
    </svg>
  );
}
