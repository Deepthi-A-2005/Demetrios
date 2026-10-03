import React from "react";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from "react-native-svg";

/**
 * SparklineChart — lightweight SVG sparkline for sensor cards
 * @param {number[]} data - array of numeric values
 * @param {string} color - hex stroke color
 * @param {number} width - chart width (px)
 * @param {number} height - chart height (px)
 * @param {boolean} showDot - show a dot at the last data point
 * @param {boolean} showFill - show gradient fill under the line
 */
export default function SparklineChart({
  data = [],
  color = "#22C55E",
  width = 80,
  height = 36,
  showDot = true,
  showFill = true,
}) {
  if (!data || data.length < 2) return null;

  const values = data.map(Number).filter((v) => !isNaN(v));
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pad = { t: 4, b: 4, l: 2, r: 2 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;

  const toX = (i) => pad.l + (i / (values.length - 1)) * w;
  const toY = (v) => pad.t + h - ((v - min) / range) * h;

  const linePath = values
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${toX(i).toFixed(2)},${toY(v).toFixed(2)}`,
    )
    .join(" ");

  const areaPath =
    linePath +
    ` L${toX(values.length - 1).toFixed(2)},${(pad.t + h).toFixed(2)} L${pad.l},${(pad.t + h).toFixed(2)} Z`;

  const lastX = toX(values.length - 1);
  const lastY = toY(values[values.length - 1]);

  const gradId = `sg_${color.replace("#", "")}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {showFill && <Path d={areaPath} fill={`url(#${gradId})`} />}

      <Path
        d={linePath}
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {showDot && (
        <>
          <Circle cx={lastX} cy={lastY} r={4} fill={color} opacity={0.3} />
          <Circle cx={lastX} cy={lastY} r={2.5} fill={color} />
        </>
      )}
    </Svg>
  );
}
