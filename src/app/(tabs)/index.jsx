/**
 * Demetrios — Dashboard Tab
 * Live sensor overview, rover status, AI analysis summary
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { MotiView } from "moti";
import { router } from "expo-router";
import {
  Wifi,
  WifiOff,
  Droplets,
  Thermometer,
  Wind,
  FlaskConical,
  ScanLine,
  Leaf,
  AlertTriangle,
  ChevronRight,
  Activity,
  MapPin,
  Zap,
  RotateCcw,
} from "lucide-react-native";
import { COLORS, FONTS, SPACING, RADIUS, SENSOR_META } from "../../utils/theme";
import SparklineChart from "../../components/SparklineChart";

const { width } = Dimensions.get("window");
const CARD_W = (width - SPACING.lg * 2 - SPACING.sm) / 2;

// ─── helpers ────────────────────────────────────────────────────────────────

const DEMO_SENSOR = {
  moisture: 62,
  temperature: 27.4,
  humidity: 71,
  ph: 6.7,
  ultrasonic: 48,
  latitude: 40.7128,
  longitude: -74.006,
};

function getStatus(key, val) {
  const m = SENSOR_META[key];
  if (!m) return "normal";
  if (val < m.warnBelow) return "danger";
  if (val > m.warnAbove) return "danger";
  return "good";
}

const ICONS = {
  moisture: Droplets,
  temperature: Thermometer,
  humidity: Wind,
  ph: FlaskConical,
  ultrasonic: ScanLine,
};

const STATUS_COLORS = {
  good: COLORS.primary,
  danger: COLORS.danger,
  warning: COLORS.warning,
};

// ─── Sensor Card ─────────────────────────────────────────────────────────────

function SensorCard({ sensorKey, value, history, delay = 0 }) {
  const meta = SENSOR_META[sensorKey];
  const Icon = ICONS[sensorKey] || Activity;
  const status = getStatus(sensorKey, value);
  const color = status === "good" ? meta.color : COLORS.danger;
  const sparkData = history?.map((h) => h[sensorKey]).filter(Boolean) || [];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 450, delay }}
      style={{
        width: CARD_W,
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={[`${color}10`, "transparent"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: `${color}20`,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Icon size={18} color={color} />
        </View>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: status === "good" ? COLORS.primary : COLORS.danger,
          }}
        />
      </View>

      {/* Value */}
      <Text
        style={{
          fontSize: FONTS.xxl,
          fontWeight: "800",
          color: COLORS.text,
          marginTop: SPACING.sm,
          letterSpacing: -0.5,
        }}
      >
        {typeof value === "number" ? value.toFixed(1) : "--"}
        <Text
          style={{
            fontSize: FONTS.sm,
            color: COLORS.textMuted,
            fontWeight: "500",
          }}
        >
          {" "}
          {meta.unit}
        </Text>
      </Text>

      <Text
        style={{
          fontSize: FONTS.xs,
          color: COLORS.textMuted,
          marginTop: 2,
          fontWeight: "500",
        }}
      >
        {meta.label}
      </Text>

      {/* Sparkline */}
      {sparkData.length > 1 && (
        <View style={{ marginTop: SPACING.sm }}>
          <SparklineChart
            data={sparkData}
            color={color}
            width={CARD_W - SPACING.md * 2}
            height={32}
          />
        </View>
      )}
    </MotiView>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: sensorData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["sensors"],
    queryFn: async () => {
      const res = await fetch("/api/sensors");
      if (!res.ok) throw new Error("Sensor fetch failed");
      return res.json();
    },
    refetchInterval: 6000,
  });

  const { data: roverData } = useQuery({
    queryKey: ["rover"],
    queryFn: async () => {
      const res = await fetch("/api/rover");
      if (!res.ok) throw new Error("Rover fetch failed");
      return res.json();
    },
    refetchInterval: 4000,
  });

  const { data: analysisData } = useQuery({
    queryKey: ["analysis"],
    queryFn: async () => {
      const res = await fetch("/api/analysis");
      if (!res.ok) throw new Error("Analysis fetch failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const latest = sensorData?.latest || DEMO_SENSOR;
  const history = sensorData?.history || [];
  const isConnected = !isError && !isLoading;
  const lastAnalysis = analysisData?.[0];

  const sensorKeys = ["moisture", "temperature", "humidity", "ph"];

  // Build alerts from sensor data
  const alerts = [];
  if (latest) {
    if (latest.moisture < 30)
      alerts.push({
        msg: "Low soil moisture — irrigation needed",
        level: "danger",
      });
    if (latest.temperature > 38)
      alerts.push({ msg: "High temperature detected", level: "warning" });
    if (latest.ultrasonic < 20)
      alerts.push({ msg: "Obstacle detected ahead", level: "danger" });
    if (latest.ph < 5.5 || latest.ph > 7.5)
      alerts.push({ msg: "Soil pH out of optimal range", level: "warning" });
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={["#0A1F10", "#060D07"]}
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: SPACING.lg,
            paddingBottom: SPACING.xl,
          }}
        >
          {/* Top row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: FONTS.xs,
                  color: COLORS.textMuted,
                  fontWeight: "600",
                  letterSpacing: 2,
                }}
              >
                SMART AGRICULTURE
              </Text>
              <Text
                style={{
                  fontSize: FONTS.xxxl,
                  fontWeight: "900",
                  color: COLORS.text,
                  letterSpacing: -1,
                  marginTop: 2,
                }}
              >
                Demetrios
              </Text>
            </View>
            {/* Connection badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: RADIUS.full,
                backgroundColor: isConnected
                  ? `${COLORS.primary}18`
                  : `${COLORS.danger}18`,
                borderWidth: 1,
                borderColor: isConnected
                  ? `${COLORS.primary}30`
                  : `${COLORS.danger}30`,
              }}
            >
              {isConnected ? (
                <Wifi size={14} color={COLORS.primary} />
              ) : (
                <WifiOff size={14} color={COLORS.danger} />
              )}
              <Text
                style={{
                  fontSize: FONTS.xs,
                  fontWeight: "700",
                  color: isConnected ? COLORS.primary : COLORS.danger,
                }}
              >
                {isConnected ? "LIVE" : "OFFLINE"}
              </Text>
            </View>
          </View>

          {/* Rover status bar */}
          <View
            style={{
              flexDirection: "row",
              marginTop: SPACING.lg,
              gap: SPACING.sm,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.bgCard,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingVertical: 12,
                paddingHorizontal: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Activity size={16} color={COLORS.primary} />
              <View>
                <Text style={{ fontSize: FONTS.xs, color: COLORS.textMuted }}>
                  Rover Mode
                </Text>
                <Text
                  style={{
                    fontSize: FONTS.sm,
                    fontWeight: "700",
                    color: COLORS.text,
                  }}
                >
                  {roverData?.command ?? "STOP"}
                </Text>
              </View>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: roverData?.is_watering
                  ? `${COLORS.info}15`
                  : COLORS.bgCard,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: roverData?.is_watering
                  ? `${COLORS.info}30`
                  : COLORS.border,
                paddingVertical: 12,
                paddingHorizontal: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Droplets
                size={16}
                color={roverData?.is_watering ? COLORS.info : COLORS.textMuted}
              />
              <View>
                <Text style={{ fontSize: FONTS.xs, color: COLORS.textMuted }}>
                  Watering
                </Text>
                <Text
                  style={{
                    fontSize: FONTS.sm,
                    fontWeight: "700",
                    color: roverData?.is_watering
                      ? COLORS.info
                      : COLORS.textMuted,
                  }}
                >
                  {roverData?.is_watering ? "Active" : "Off"}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingVertical: 12,
                paddingHorizontal: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <MapPin size={16} color={COLORS.accent} />
              <View>
                <Text style={{ fontSize: FONTS.xs, color: COLORS.textMuted }}>
                  GPS
                </Text>
                <Text
                  style={{
                    fontSize: FONTS.xs,
                    fontWeight: "700",
                    color: COLORS.accent,
                  }}
                >
                  {latest?.latitude ? latest.latitude.toFixed(3) : "--"}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: SPACING.lg }}>
          {/* ── Alerts ── */}
          {alerts.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 400 }}
              style={{ marginTop: SPACING.lg }}
            >
              <View
                style={{
                  backgroundColor: `${COLORS.danger}12`,
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: `${COLORS.danger}25`,
                  padding: SPACING.md,
                  gap: 8,
                }}
              >
                {alerts.map((a, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <AlertTriangle
                      size={14}
                      color={
                        a.level === "danger" ? COLORS.danger : COLORS.warning
                      }
                    />
                    <Text
                      style={{
                        fontSize: FONTS.sm,
                        color: COLORS.text,
                        flex: 1,
                      }}
                    >
                      {a.msg}
                    </Text>
                  </View>
                ))}
              </View>
            </MotiView>
          )}

          {/* ── Section: Sensors ── */}
          <View style={{ marginTop: SPACING.lg }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: SPACING.md,
              }}
            >
              <Text
                style={{
                  fontSize: FONTS.lg,
                  fontWeight: "800",
                  color: COLORS.text,
                }}
              >
                Sensor Data
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                {isLoading && (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                )}
                <Text style={{ fontSize: FONTS.xs, color: COLORS.textMuted }}>
                  Live • 6s
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: SPACING.sm,
              }}
            >
              {sensorKeys.map((key, i) => (
                <SensorCard
                  key={key}
                  sensorKey={key}
                  value={latest?.[key]}
                  history={history}
                  delay={i * 80}
                />
              ))}
            </View>

            {/* Ultrasonic full width */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 450, delay: 320 }}
              style={{
                marginTop: SPACING.sm,
                backgroundColor: COLORS.bgCard,
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor:
                  latest?.ultrasonic < 20
                    ? `${COLORS.danger}40`
                    : COLORS.border,
                padding: SPACING.md,
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.md,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={[
                  latest?.ultrasonic < 20
                    ? `${COLORS.danger}12`
                    : `${COLORS.warning}10`,
                  "transparent",
                ]}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: `${COLORS.warning}20`,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ScanLine size={22} color={COLORS.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: FONTS.xs,
                    color: COLORS.textMuted,
                    fontWeight: "600",
                  }}
                >
                  OBSTACLE SENSOR (ULTRASONIC)
                </Text>
                <Text
                  style={{
                    fontSize: FONTS.xxl,
                    fontWeight: "800",
                    color: COLORS.text,
                    marginTop: 2,
                  }}
                >
                  {latest?.ultrasonic?.toFixed(1) ?? "--"}
                  <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted }}>
                    {" "}
                    cm
                  </Text>
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {latest?.ultrasonic < 20 ? (
                  <View
                    style={{
                      backgroundColor: `${COLORS.danger}20`,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: RADIUS.full,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.danger,
                        fontSize: FONTS.xs,
                        fontWeight: "700",
                      }}
                    >
                      ⚠ OBSTACLE
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: `${COLORS.primary}20`,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: RADIUS.full,
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.primary,
                        fontSize: FONTS.xs,
                        fontWeight: "700",
                      }}
                    >
                      CLEAR
                    </Text>
                  </View>
                )}
                <SparklineChart
                  data={history.map((h) => h.ultrasonic).filter(Boolean)}
                  color={COLORS.warning}
                  width={80}
                  height={28}
                />
              </View>
            </MotiView>
          </View>

          {/* ── Quick Actions ── */}
          <View style={{ marginTop: SPACING.xl }}>
            <Text
              style={{
                fontSize: FONTS.lg,
                fontWeight: "800",
                color: COLORS.text,
                marginBottom: SPACING.md,
              }}
            >
              Quick Actions
            </Text>
            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
              {[
                {
                  label: "Control Rover",
                  icon: Zap,
                  color: COLORS.primary,
                  route: "/control",
                },
                {
                  label: "AI Vision",
                  icon: Leaf,
                  color: "#A78BFA",
                  route: "/camera",
                },
                {
                  label: "Analytics",
                  icon: Activity,
                  color: COLORS.info,
                  route: "/analytics",
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => router.push(item.route)}
                  activeOpacity={0.75}
                  style={{ flex: 1 }}
                >
                  <View
                    style={{
                      backgroundColor: `${item.color}12`,
                      borderRadius: RADIUS.md,
                      borderWidth: 1,
                      borderColor: `${item.color}25`,
                      padding: SPACING.md,
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <item.icon size={22} color={item.color} />
                    <Text
                      style={{
                        fontSize: FONTS.xs,
                        fontWeight: "700",
                        color: item.color,
                        textAlign: "center",
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Latest AI Analysis ── */}
          {lastAnalysis && (
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500, delay: 200 }}
              style={{ marginTop: SPACING.xl }}
            >
              <Text
                style={{
                  fontSize: FONTS.lg,
                  fontWeight: "800",
                  color: COLORS.text,
                  marginBottom: SPACING.md,
                }}
              >
                Latest AI Analysis
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/camera")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    lastAnalysis.health_status === "Good"
                      ? [`${COLORS.primary}15`, `${COLORS.primary}05`]
                      : lastAnalysis.health_status === "Poor"
                        ? [`${COLORS.danger}15`, `${COLORS.danger}05`]
                        : [`${COLORS.warning}15`, `${COLORS.warning}05`]
                  }
                  style={{
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    borderColor:
                      lastAnalysis.health_status === "Good"
                        ? `${COLORS.primary}25`
                        : lastAnalysis.health_status === "Poor"
                          ? `${COLORS.danger}25`
                          : `${COLORS.warning}25`,
                    padding: SPACING.md,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Leaf
                        size={20}
                        color={
                          lastAnalysis.health_status === "Good"
                            ? COLORS.primary
                            : lastAnalysis.health_status === "Poor"
                              ? COLORS.danger
                              : COLORS.warning
                        }
                      />
                      <View>
                        <Text
                          style={{
                            fontSize: FONTS.xs,
                            color: COLORS.textMuted,
                          }}
                        >
                          Crop Health Status
                        </Text>
                        <Text
                          style={{
                            fontSize: FONTS.lg,
                            fontWeight: "800",
                            color:
                              lastAnalysis.health_status === "Good"
                                ? COLORS.primary
                                : lastAnalysis.health_status === "Poor"
                                  ? COLORS.danger
                                  : COLORS.warning,
                          }}
                        >
                          {lastAnalysis.health_status}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  </View>
                  <Text
                    style={{
                      fontSize: FONTS.sm,
                      color: COLORS.textMuted,
                      marginTop: SPACING.sm,
                      lineHeight: 20,
                    }}
                    numberOfLines={3}
                  >
                    {lastAnalysis.recommendation}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </MotiView>
          )}

          {/* GPS coordinates */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 600, delay: 400 }}
            style={{
              marginTop: SPACING.xl,
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.lg,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: SPACING.md,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: SPACING.md,
              }}
            >
              <MapPin size={16} color={COLORS.accent} />
              <Text
                style={{
                  fontSize: FONTS.md,
                  fontWeight: "700",
                  color: COLORS.text,
                }}
              >
                GPS Location
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: SPACING.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONTS.xs, color: COLORS.textMuted }}>
                  Latitude
                </Text>
                <Text
                  style={{
                    fontSize: FONTS.md,
                    fontWeight: "700",
                    color: COLORS.text,
                  }}
                >
                  {latest?.latitude?.toFixed(6) ?? "N/A"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONTS.xs, color: COLORS.textMuted }}>
                  Longitude
                </Text>
                <Text
                  style={{
                    fontSize: FONTS.md,
                    fontWeight: "700",
                    color: COLORS.text,
                  }}
                >
                  {latest?.longitude?.toFixed(6) ?? "N/A"}
                </Text>
              </View>
            </View>
            {/* Simulated coordinate display */}
            <View
              style={{
                marginTop: SPACING.md,
                backgroundColor: "rgba(163,230,53,0.06)",
                borderRadius: RADIUS.md,
                padding: SPACING.sm,
              }}
            >
              <Text
                style={{
                  fontSize: FONTS.xs,
                  color: COLORS.accent,
                  fontFamily: "monospace",
                }}
              >
                🛰 Rover tracking active • Signal strong
              </Text>
            </View>
          </MotiView>

          {/* Footer spacer */}
          <View style={{ height: SPACING.lg }} />
        </View>
      </ScrollView>
    </View>
  );
}
