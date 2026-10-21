import { encode } from "uqr";
import { cn } from "../lib/cn";
import { zatcaTlv, type ZatcaFields } from "../saudi/invoice";

/** A QR code as SVG: black modules on white in every theme (many scanners do not read light-on-dark codes), with a quiet zone of 4 modules. */
export function QrCode({
  value,
  label,
  size = 160,
  ecc = "M",
  className,
}: {
  value: string;
  /** Accessible name. */
  label: string;
  /** Width and height in px. */
  size?: number;
  /** Error correction: L 7 %, M 15 %, Q 25 %, H 30 % of the code can be lost. */
  ecc?: "L" | "M" | "Q" | "H";
  className?: string;
}) {
  const { size: n, data } = encode(value, { ecc, border: 4 });
  // One rectangle per horizontal run of dark modules keeps the path short.
  let d = "";
  data.forEach((row, y) => {
    for (let x = 0; x < n; x++) {
      if (!row[x]) continue;
      const start = x;
      while (row[x + 1]) x++;
      d += `M${start} ${y}h${x - start + 1}v1H${start}z`;
    }
  });
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${n} ${n}`} width={size} height={size} shapeRendering="crispEdges" className={cn("shrink-0", className)}>
      <rect width={n} height={n} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}

/** The ZATCA QR code of a simplified tax invoice (TLV tags 1–5, see `zatcaTlv`). */
export const ZatcaQr = ({ label, size, className, ...fields }: ZatcaFields & { label: string; size?: number; className?: string }) => (
  <QrCode value={zatcaTlv(fields)} label={label} size={size} className={className} />
);
