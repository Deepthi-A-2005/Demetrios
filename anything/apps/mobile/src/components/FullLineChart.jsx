import React from "react";
import { View, Text } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Line,
  Text as SvgText,
} from "react-native-svg";
import { COLORS, FONTS } from "../utils/theme";

/**
 * FullLineChart — detailed SVG line chart for the analytics screen
 * @param {Array<{value: number, label: string}>} data - data points with value and label
 * @param {string} color - line color
 * @param {number} width - total width
 * @param {number} height - total height
 * @param {string} unit - y-axis unit label
 */
export default function FullLineChart({
  data = [],
  color = "#22C55E",
  width = 300,
  height = 180,
  unit = "",
}) {
  if (!data || data.length < 2) {
    return (
      <View
        style={{
          width,
          height,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: COLORS.textMuted, fontSize: FONTS.sm }}>
          No data available
        </Text>
      </View>
    );
  }

  const values = data.map((d) => Number(d.value)).filter((v) => !isNaN(v));
  const labels = data.map((d) => String(d.label ?? ""));

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pad = { top: 16, bottom: 36, left: 44, right: 16 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const toX = (i) => pad.left + (i / (values.length - 1)) * cw;
  const toY = (v) => pad.top + ch - ((v - min) / range) * ch;

  const linePath = values
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${toX(i).toFixed(2)},${toY(v).toFixed(2)}`,
    )
    .join(" ");

  const areaPath =
    linePath +
    ` L${toX(values.length - 1)},${pad.top + ch} L${pad.left},${pad.top + ch} Z`;

  // Y-axis grid lines & labels
  const ySteps = 4;
  const gridLines = Array.from({ length: ySteps + 1 }, (_, i) => {
    const frac = i / ySteps;
    const val = min + frac * range;
    const y = pad.top + ch - frac * ch;
    return { y, val };
  });

  // X-axis labels — show max 5 labels
  const maxXLabels = 5;
  const step = Math.max(1, Math.floor(labels.length / maxXLabels));
  const xLabels = labels
    .map((l, i) => ({ l, i }))
    .filter(({ i }) => i % step === 0 || i === labels.length - 1);

  const gradId = `flg_${color.replace("#", "")}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {gridLines.map(({ y, val }, i) => (
        <React.Fragment key={i}>
          <Line
            x1={pad.left}
            y1={y}
            x2={pad.left + cw}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          <SvgText
            x={pad.left - 6}
            y={y + 4}
            fill="rgba(255,255,255,0.3)"
            fontSize="9"
            textAnchor="end"
          >
            {Number.isInteger(range) ? val.toFixed(0) : val.toFixed(1)}
          </SvgText>
        </React.Fragment>
      ))}

      {/* Area fill */}
      <Path d={areaPath} fill={`url(#${gradId})`} />

      {/* Line */}
      <Path
        d={linePath}
        stroke={color}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data point dots */}
      {values.map((v, i) => (
        <Circle
          key={i}
          cx={toX(i)}
          cy={toY(v)}
          r={values.length > 10 ? 2 : 3.5}
          fill={color}
          opacity={0.85}
        />
      ))}

      {/* Last point highlight */}
      <Circle
        cx={toX(values.length - 1)}
        cy={toY(values[values.length - 1])}
        r={6}
        fill={color}
        opacity={0.2}
      />
      <Circle
        cx={toX(values.length - 1)}
        cy={toY(values[values.length - 1])}
        r={3.5}
        fill={color}
      />

      {/* X axis labels */}
      {xLabels.map(({ l, i }) => (
        <SvgText
          key={i}
          x={toX(i)}
          y={pad.top + ch + 18}
          fill="rgba(255,255,255,0.3)"
          fontSize="9"
          textAnchor="middle"
        >
          {l}
        </SvgText>
      ))}

      {/* Unit label */}
      {unit ? (
        <SvgText
          x={pad.left - 30}
          y={pad.top - 4}
          fill={color}
          fontSize="9"
          opacity={0.7}
        >
          {unit}
        </SvgText>
      ) : null}
    </Svg>
  );
}
