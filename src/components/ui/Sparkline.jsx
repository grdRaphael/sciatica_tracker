// Inline SVG sparkline — no Chart.js, keeps bundle small
export function Sparkline({ data = [], color = "#10b981", height = 32, className = "" }) {
  if (!data.length) return <div className={`h-${Math.round(height / 4)} ${className}`} />;

  const w = 96;
  const h = height;
  const pad = 3;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polyline = points.join(" ");
  const area = `${points[0].split(",")[0]},${h} ${polyline} ${points[points.length - 1].split(",")[0]},${h}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={area}
        fill={`url(#sg-${color.replace("#", "")})`}
      />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* last point dot */}
      {points.length > 0 && (() => {
        const [lx, ly] = points[points.length - 1].split(",").map(Number);
        return <circle cx={lx} cy={ly} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}
