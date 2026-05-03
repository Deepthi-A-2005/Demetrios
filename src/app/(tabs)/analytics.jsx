/**
 * Demetrios — Analytics Tab
 * Full sensor trend charts with stats, historical data, predictions
 */
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  RefreshCw,
  Calendar,
  Droplets,
  Thermometer,
  Wind,
  FlaskConical,
} from "lucide-react-native";
import { COLORS, FONTS, SPACING, RADIUS, SENSOR_META } from "../../utils/theme";
import FullLineChart from "../../components/FullLineChart";
import SparklineChart from "../../components/SparklineChart";

const { width } = Dimensions.get("window");
const CHART_W = width - SPACING.lg * 2 - SPACING.md * 2;

const SENSOR_TABS = [
  { key: "moisture", label: "Moisture", Icon: Droplets, color: "#38BDF8" },
  {
    key: "temperature",
    label: "Temperature",
    Icon: Thermometer,
    color: "#F59E0B",
  },
  { key: "humidity", label: "Humidity", Icon: Wind, color: "#A78BFA" },
  { key: "ph", label: "pH", Icon: FlaskConical, color: "#22C55E" },
];

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ values, color, unit }) {
  if (!values?.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return (
    <View style={{ flexDirection: "row", gap: 0 }}>
      {[
        { label: "MIN", value: min },
        { label: "AVG", value: avg },
        { label: "MAX", value: max },
      ].map((s, i) => (
        <View
          key={s.label}
          style={{
            flex: 1,
            alignItems: "center",
            paddingVertical: 12,
            borderRightWidth: i < 2 ? 1 : 0,
            borderRightColor: "rgba(255,255,255,0.06)",
          }}
        >
          <Text
            style={{
              fontSize: FONTS.xs,
              color: COLORS.textMuted,
              fontWeight: "600",
            }}
          >
            {s.label}
          </Text>
          <Text
            style={{
              fontSize: FONTS.xl,
              fontWeight: "900",
              color: s.label === "AVG" ? color : COLORS.text,
              marginTop: 2,
            }}
          >
            {s.value.toFixed(1)}
          </Text>
          <Text style={{ fontSize: 10, color: COLORS.textMuted }}>{unit}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Trend pill ───────────────────────────────────────────────────────────────

function TrendPill({ values }) {
  if (!values || values.length < 2) return null;
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const pct = first !== 0 ? ((delta / first) * 100).toFixed(1) : "0.0";
  const rising = delta > 0;
  const stable = Math.abs(delta) < 0.5;

  if (stable)
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: "rgba(255,255,255,0.08)",
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: RADIUS.full,
        }}
      >
        <Minus size={12} color={COLORS.textMuted} />
        <Text
          style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: "700" }}
        >
          Stable
        </Text>
      </View>
    );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: rising
          ? "rgba(245,158,11,0.15)"
          : "rgba(34,197,94,0.15)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.full,
      }}
    >
      {rising ? (
        <TrendingUp size={12} color={COLORS.warning} />
      ) : (
        <TrendingDown size={12} color={COLORS.primary} />
      )}
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: rising ? COLORS.warning : COLORS.primary,
        }}
      >
        {rising ? "+" : ""}
        {pct}%
      </Text>
    </View>
  );
}

// ─── Prediction Card ──────────────────────────────────────────────────────────

function PredictionCard({ sensorKey, values, color, unit }) {
  if (!values?.length) return null;
  const last3 = values.slice(-3);
  const avg3 = last3.reduce((a, b) => a + b, 0) / last3.length;
  const prev3 = values.slice(-6, -3);
  const avg6 = prev3.length
    ? prev3.reduce((a, b) => a + b, 0) / prev3.length
    : avg3;
  const delta = avg3 - avg6;
  const predicted = Math.max(0, avg3 + delta * 2).toFixed(1);
  const meta = SENSOR_META[sensorKey];

  return (
    <View
      style={{
        backgroundColor: `${color}0D`,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: `${color}20`,
        padding: SPACING.md,
        flex: 1,
      }}
    >
      <Text
        style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: "600" }}
      >
        PREDICTED NEXT
      </Text>
      <Text
        style={{ fontSize: FONTS.xl, fontWeight: "900", color, marginTop: 4 }}
      >
        {predicted}
        <Text style={{ fontSize: 11, color: COLORS.textMuted }}> {unit}</Text>
      </Text>
      <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>
        {delta > 0 ? "↑ Rising" : delta < 0 ? "↓ Falling" : "→ Stable"} trend
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [activeSensor, setActiveSensor] = useState("moisture");

  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ["sensors"],
    queryFn: async () => {
      const res = await fetch("/api/sensors");
      if (!res.ok) throw new Error("Failed to fetch sensor data");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const history = data?.history || [];

  const activeMeta = SENSOR_TABS.find((s) => s.key === activeSensor);
  const sensorMeta = SENSOR_META[activeSensor];

  // Build chart data from history
  const chartData = useMemo(() => {
    return history.map((h, i) => {
      const date = new Date(h.timestamp);
      const label = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return { value: h[activeSensor] ?? 0, label };
    });
  }, [history, activeSensor]);

  const values = chartData.map((d) => d.value);

  // Summary for all sensors
  const summaries = useMemo(() => {
    return SENSOR_TABS.map((s) => {
      const vals = history.map((h) => h[s.key]).filter(Boolean);
      const latest = data?.latest?.[s.key];
      const avg = vals.length
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : 0;
      return { ...s, latest, avg, vals };
    });
  }, [history, data]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={["#0A1A0C", "#060D07"]}
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: SPACING.lg,
            paddingBottom: SPACING.lg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
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
                DEMETRIOS
              </Text>
              <Text
                style={{
                  fontSize: FONTS.xxl,
                  fontWeight: "900",
                  color: COLORS.text,
                  letterSpacing: -0.5,
                  marginTop: 2,
                }}
              >
                Analytics
              </Text>
              <Text
                style={{
                  fontSize: FONTS.sm,
                  color: COLORS.textMuted,
                  marginTop: 4,
                }}
              >
                {history.length} data points • Real-time
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                refetch();
              }}
            >
              <View
                style={{
                  padding: 10,
                  backgroundColor: COLORS.bgCard,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <RefreshCw size={18} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View
          style={{
            paddingHorizontal: SPACING.lg,
            gap: SPACING.lg,
            marginTop: SPACING.lg,
          }}
        >
          {/* Summary mini cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -SPACING.lg, flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: 10 }}
          >
            {summaries.map((s, i) => (
              <TouchableOpacity
                key={s.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveSensor(s.key);
                }}
                activeOpacity={0.8}
              >
                <MotiView
                  animate={{
                    borderColor:
                      activeSensor === s.key
                        ? s.color
                        : "rgba(255,255,255,0.08)",
                    backgroundColor:
                      activeSensor === s.key
                        ? `${s.color}12`
                        : "rgba(255,255,255,0.04)",
                  }}
                  transition={{ type: "timing", duration: 200 }}
                  style={{
                    width: 120,
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    padding: SPACING.md,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <s.Icon size={14} color={s.color} />
                    <Text
                      style={{
                        fontSize: 10,
                        color: COLORS.textMuted,
                        fontWeight: "600",
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {s.label}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: FONTS.xl,
                      fontWeight: "900",
                      color: activeSensor === s.key ? s.color : COLORS.text,
                    }}
                  >
                    {s.latest?.toFixed(1) ?? "--"}
                    <Text style={{ fontSize: 10, color: COLORS.textMuted }}>
                      {" "}
                      {SENSOR_META[s.key]?.unit}
                    </Text>
                  </Text>
                  <SparklineChart
                    data={s.vals.slice(-8)}
                    color={s.color}
                    width={88}
                    height={24}
                    showDot={false}
                  />
                </MotiView>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chart section */}
          <MotiView
            key={activeSensor}
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: COLORS.border,
              overflow: "hidden",
            }}
          >
            {/* Chart header */}
            <View
              style={{
                padding: SPACING.md,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                {activeMeta && (
                  <activeMeta.Icon size={18} color={activeMeta.color} />
                )}
                <View>
                  <Text
                    style={{
                      fontSize: FONTS.md,
                      fontWeight: "800",
                      color: COLORS.text,
                    }}
                  >
                    {activeMeta?.label}
                  </Text>
                  <Text style={{ fontSize: FONTS.xs, color: COLORS.textMuted }}>
                    Last {history.length} readings
                  </Text>
                </View>
              </View>
              <TrendPill values={values} />
            </View>

            {/* Chart */}
            {isLoading ? (
              <View
                style={{
                  height: 200,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator
                  color={activeMeta?.color || COLORS.primary}
                />
              </View>
            ) : chartData.length < 2 ? (
              <View
                style={{
                  height: 180,
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <BarChart3 size={36} color={COLORS.textMuted} />
                <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted }}>
                  Not enough data yet
                </Text>
              </View>
            ) : (
              <View
                style={{
                  paddingHorizontal: SPACING.md,
                  paddingBottom: SPACING.md,
                }}
              >
                <FullLineChart
                  data={chartData}
                  color={activeMeta?.color || COLORS.primary}
                  width={CHART_W}
                  height={200}
                  unit={sensorMeta?.unit}
                />
              </View>
            )}

            {/* Stats bar */}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.06)",
              }}
            >
              <StatsBar
                values={values}
                color={activeMeta?.color || COLORS.primary}
                unit={sensorMeta?.unit}
              />
            </View>
          </MotiView>

          {/* Predictions */}
          <View>
            <Text
              style={{
                fontSize: FONTS.lg,
                fontWeight: "800",
                color: COLORS.text,
                marginBottom: SPACING.md,
              }}
            >
              Predictive Analytics
            </Text>
            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
              {SENSOR_TABS.slice(0, 2).map((s) => {
                const vals = history.map((h) => h[s.key]).filter(Boolean);
                return (
                  <PredictionCard
                    key={s.key}
                    sensorKey={s.key}
                    values={vals}
                    color={s.color}
                    unit={SENSOR_META[s.key]?.unit}
                  />
                );
              })}
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: SPACING.sm,
                marginTop: SPACING.sm,
              }}
            >
              {SENSOR_TABS.slice(2).map((s) => {
                const vals = history.map((h) => h[s.key]).filter(Boolean);
                return (
                  <PredictionCard
                    key={s.key}
                    sensorKey={s.key}
                    values={vals}
                    color={s.color}
                    unit={SENSOR_META[s.key]?.unit}
                  />
                );
              })}
            </View>
          </View>

          {/* Data quality */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 450, delay: 200 }}
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: SPACING.lg,
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
              <Calendar size={18} color={COLORS.textMuted} />
              <Text
                style={{
                  fontSize: FONTS.md,
                  fontWeight: "700",
                  color: COLORS.text,
                }}
              >
                Data Quality Report
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              {[
                {
                  label: "Total Readings",
                  value: history.length.toString(),
                  color: COLORS.primary,
                },
                {
                  label: "Latest Update",
                  value: data?.latest?.timestamp
                    ? new Date(data.latest.timestamp).toLocaleTimeString()
                    : "N/A",
                  color: COLORS.info,
                },
                {
                  label: "Data Coverage",
                  value: history.length > 0 ? "100%" : "0%",
                  color: COLORS.accent,
                },
                {
                  label: "Sensor Status",
                  value: isError ? "Offline" : "Online",
                  color: isError ? COLORS.danger : COLORS.primary,
                },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted }}>
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: FONTS.sm,
                      fontWeight: "700",
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </MotiView>

          {/* Raw history table */}
          {history.length > 0 && (
            <View>
              <Text
                style={{
                  fontSize: FONTS.lg,
                  fontWeight: "800",
                  color: COLORS.text,
                  marginBottom: SPACING.md,
                }}
              >
                Recent Readings
              </Text>
              <View
                style={{
                  backgroundColor: COLORS.bgCard,
                  borderRadius: RADIUS.xl,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  overflow: "hidden",
                }}
              >
                {/* Table header */}
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: SPACING.md,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  {["Time", "Moisture", "Temp", "pH"].map((h) => (
                    <Text
                      key={h}
                      style={{
                        flex: 1,
                        fontSize: 10,
                        fontWeight: "700",
                        color: COLORS.textMuted,
                        textAlign: "center",
                      }}
                    >
                      {h}
                    </Text>
                  ))}
                </View>
                {history
                  .slice(-8)
                  .reverse()
                  .map((row, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        paddingHorizontal: SPACING.md,
                        paddingVertical: 10,
                        borderBottomWidth: i < 7 ? 1 : 0,
                        borderBottomColor: "rgba(255,255,255,0.04)",
                        backgroundColor:
                          i % 2 === 0
                            ? "transparent"
                            : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontSize: FONTS.xs,
                          color: COLORS.textMuted,
                          textAlign: "center",
                        }}
                      >
                        {new Date(row.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: FONTS.xs,
                          color: "#38BDF8",
                          fontWeight: "700",
                          textAlign: "center",
                        }}
                      >
                        {row.moisture?.toFixed(1)}%
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: FONTS.xs,
                          color: "#F59E0B",
                          fontWeight: "700",
                          textAlign: "center",
                        }}
                      >
                        {row.temperature?.toFixed(1)}°
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: FONTS.xs,
                          color: COLORS.primary,
                          fontWeight: "700",
                          textAlign: "center",
                        }}
                      >
                        {row.ph?.toFixed(1)}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
