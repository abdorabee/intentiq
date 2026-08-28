import type { CalibrationState } from "./calibration-state";

const TAU = Math.PI * 2;

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

/**
 * Static schematic of the calibration instrument. Serves as the server-rendered
 * base layer and the full representation when WebGL is unavailable. State
 * changes are plain attribute/opacity updates — no JS animation required.
 */
export default function CalibrationFallback({
  state,
  className,
}: {
  state: CalibrationState;
  className?: string;
}) {
  const cx = 160;
  const cy = 160;

  const ticks = Array.from({ length: 48 }, (_, i) => {
    const angle = (i / 48) * TAU;
    const major = i % 4 === 0;
    const from = polar(cx, cy, 128, angle);
    const to = polar(cx, cy, major ? 138 : 133, angle);
    return { key: i, from, to, major };
  });

  const industryDots = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * TAU - Math.PI / 2;
    const point = polar(cx, cy, 86, angle);
    return { key: i, point, on: i < Math.min(state.industryCount, 8) };
  });

  const sizeAngle =
    state.sizeIndex >= 0 ? (state.sizeIndex / 4) * TAU - Math.PI / 2 : null;
  const sizePoint = sizeAngle !== null ? polar(cx, cy, 108, sizeAngle) : null;

  const energyRadius = 66;
  const energyLength = TAU * energyRadius;
  const energyVisible = Math.max(0.04, state.completion);

  const dialAngle = (index: number) =>
    index >= 0 ? -120 + (index / 3) * 240 : -120;

  return (
    <svg
      viewBox="0 0 320 320"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Fine mechanical markings */}
      <g stroke="#3a3e44" strokeWidth="1">
        {ticks.map((tick) => (
          <line
            key={tick.key}
            x1={tick.from.x}
            y1={tick.from.y}
            x2={tick.to.x}
            y2={tick.to.y}
            opacity={tick.major ? 0.9 : 0.45}
          />
        ))}
      </g>

      {/* Concentric rings */}
      <circle cx={cx} cy={cy} r={122} fill="none" stroke="#24272b" strokeWidth="2" />
      <circle
        cx={cx}
        cy={cy}
        r={108}
        fill="none"
        stroke="#2e3237"
        strokeWidth="1.5"
        className="vw-cal-part"
        data-on={state.sizeIndex >= 0 || state.stage >= 1 || undefined}
      />
      <circle
        cx={cx}
        cy={cy}
        r={86}
        fill="none"
        stroke="#2e3237"
        strokeWidth="1.5"
        className="vw-cal-part"
        data-on={state.industryCount > 0 || state.stage >= 1 || undefined}
      />
      <circle cx={cx} cy={cy} r={44} fill="none" stroke="#3a3e44" strokeWidth="2" />

      {/* Energy line: arc length tracks completion */}
      <circle
        cx={cx}
        cy={cy}
        r={energyRadius}
        fill="none"
        stroke="#dfff00"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={energyLength}
        strokeDashoffset={energyLength * (1 - energyVisible)}
        transform={`rotate(-90 ${cx} ${cy})`}
        className="vw-cal-energy"
      />

      {/* Buyer / motion pathways */}
      <path
        d={`M ${polar(cx, cy, 108, Math.PI * 0.82).x} ${polar(cx, cy, 108, Math.PI * 0.82).y} Q ${cx - 30} ${cy - 30} ${cx - 18} ${cy - 8}`}
        fill="none"
        stroke="#dfff00"
        strokeWidth="1.5"
        className="vw-cal-part"
        data-on={state.buyerIndex >= 0 || undefined}
      />
      <path
        d={`M ${polar(cx, cy, 108, Math.PI * 1.68).x} ${polar(cx, cy, 108, Math.PI * 1.68).y} Q ${cx + 34} ${cy + 26} ${cx + 18} ${cy + 8}`}
        fill="none"
        stroke="#dfff00"
        strokeWidth="1.5"
        className="vw-cal-part"
        data-on={state.motionIndex >= 0 || undefined}
      />

      {/* Industry modules */}
      {industryDots.map((dot) => (
        <rect
          key={dot.key}
          x={dot.point.x - 5}
          y={dot.point.y - 5}
          width={10}
          height={10}
          fill={dot.on ? "#3a3e44" : "none"}
          stroke={dot.on ? "#dfff00" : "#2e3237"}
          strokeWidth="1"
          className="vw-cal-part"
          data-on={dot.on || undefined}
        />
      ))}

      {/* Company-size marker */}
      {sizePoint && (
        <rect
          x={sizePoint.x - 6}
          y={sizePoint.y - 6}
          width={12}
          height={12}
          fill="#24272b"
          stroke="#f7f8f8"
          strokeWidth="1.2"
          transform={`rotate(45 ${sizePoint.x} ${sizePoint.y})`}
        />
      )}

      {/* Central module */}
      <g
        className="vw-cal-part"
        data-on={state.coreInstalled || undefined}
      >
        <polygon
          points={Array.from({ length: 8 }, (_, i) => {
            const point = polar(cx, cy, 30, (i / 8) * TAU + Math.PI / 8);
            return `${point.x},${point.y}`;
          }).join(" ")}
          fill="#2e3237"
          stroke={state.coreInstalled ? "#dfff00" : "#3a3e44"}
          strokeWidth="1.5"
        />
        <circle cx={cx} cy={cy} r={6} fill={state.coreInstalled ? "#dfff00" : "#3a3e44"} />
      </g>

      {/* Deal-size and sales-cycle dials */}
      {[
        { x: cx - 74, index: state.dealIndex },
        { x: cx + 74, index: state.cycleIndex },
      ].map((dial, i) => (
        <g key={i} className="vw-cal-part" data-on={dial.index >= 0 || undefined}>
          <circle
            cx={dial.x}
            cy={cy + 116}
            r={16}
            fill="#24272b"
            stroke={dial.index >= 0 ? "#dfff00" : "#3a3e44"}
            strokeWidth="1.5"
          />
          <line
            x1={dial.x}
            y1={cy + 116}
            x2={dial.x}
            y2={cy + 103}
            stroke="#f7f8f8"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${dialAngle(dial.index)} ${dial.x} ${cy + 116})`}
          />
        </g>
      ))}
    </svg>
  );
}
