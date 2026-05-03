// Demetrios — Smart Agriculture AI Platform
// Unified design system tokens

export const COLORS = {
  // Backgrounds
  bg: "#060D07",
  bgSecondary: "#0A1A0C",
  bgCard: "rgba(255, 255, 255, 0.06)",
  bgCardHover: "rgba(255, 255, 255, 0.09)",

  // Borders
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.12)",

  // Primary (Green)
  primary: "#22C55E",
  primaryDark: "#16A34A",
  primaryLight: "#4ADE80",
  primaryGlow: "rgba(34, 197, 94, 0.25)",

  // Accent (Lime)
  accent: "#A3E635",
  accentDark: "#84CC16",

  // Status
  warning: "#F59E0B",
  warningGlow: "rgba(245, 158, 11, 0.25)",
  danger: "#EF4444",
  dangerGlow: "rgba(239, 68, 68, 0.25)",
  info: "#38BDF8",
  infoGlow: "rgba(56, 189, 248, 0.25)",
  success: "#22C55E",

  // Text
  text: "#F0FDF4",
  textSub: "#86EFAC",
  textMuted: "#4B7255",
  textDim: "#1F3D26",

  // Tab bar
  tabBar: "rgba(10, 26, 12, 0.95)",
  tabActive: "#22C55E",
  tabInactive: "#4B7255",
};

export const GRADIENTS = {
  primary: ["#22C55E", "#16A34A"],
  bg: ["#060D07", "#0A1A0C"],
  card: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"],
  greenGlow: ["rgba(34,197,94,0.15)", "rgba(34,197,94,0)"],
  danger: ["#EF4444", "#DC2626"],
  warning: ["#F59E0B", "#D97706"],
  info: ["#38BDF8", "#0EA5E9"],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONTS = {
  // Size scale
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const SENSOR_META = {
  moisture: {
    label: "Soil Moisture",
    unit: "%",
    color: "#38BDF8",
    icon: "Droplets",
    range: [0, 100],
    warnBelow: 30,
    warnAbove: 85,
  },
  temperature: {
    label: "Temperature",
    unit: "°C",
    color: "#F59E0B",
    icon: "Thermometer",
    range: [0, 60],
    warnBelow: 10,
    warnAbove: 40,
  },
  humidity: {
    label: "Humidity",
    unit: "%",
    color: "#A78BFA",
    icon: "Wind",
    range: [0, 100],
    warnBelow: 20,
    warnAbove: 90,
  },
  ph: {
    label: "Soil pH",
    unit: "pH",
    color: "#22C55E",
    icon: "FlaskConical",
    range: [0, 14],
    warnBelow: 5.5,
    warnAbove: 7.5,
  },
  ultrasonic: {
    label: "Obstacle",
    unit: "cm",
    color: "#FB923C",
    icon: "ScanLine",
    range: [0, 400],
    warnBelow: 20,
    warnAbove: 400,
  },
};
