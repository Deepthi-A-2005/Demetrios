/**
 * Demetrios — Settings Tab
 * Rover config, alerts panel, notification preferences, about
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { MotiView, AnimatePresence } from "moti";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  Server,
  Wifi,
  Shield,
  Leaf,
  Cpu,
  Trash2,
  RotateCcw,
  CheckCircle,
  Zap,
  Droplets,
  Thermometer,
  FlaskConical,
} from "lucide-react-native";
import { COLORS, FONTS, SPACING, RADIUS } from "../../utils/theme";

const APP_VERSION = "1.0.0";

// ─── Setting row ──────────────────────────────────────────────────────────────

function SettingRow({
  icon: Icon,
  iconColor,
  label,
  sublabel,
  right,
  onPress,
  isFirst,
  danger,
}) {
  const ic = iconColor || COLORS.primary;
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 14,
        borderTopWidth: isFirst ? 0 : 0.5,
        borderTopColor: "rgba(255,255,255,0.06)",
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: `${danger ? COLORS.danger : ic}18`,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Icon size={17} color={danger ? COLORS.danger : ic} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: FONTS.md,
            fontWeight: "600",
            color: danger ? COLORS.danger : COLORS.text,
          }}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text
            style={{
              fontSize: FONTS.xs,
              color: COLORS.textMuted,
              marginTop: 1,
            }}
          >
            {sublabel}
          </Text>
        ) : null}
      </View>
      {right !== undefined ? (
        right
      ) : onPress ? (
        <ChevronRight size={16} color={COLORS.textMuted} />
      ) : null}
    </Wrapper>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ marginBottom: SPACING.lg }}>
      {title ? (
        <Text
          style={{
            fontSize: FONTS.xs,
            color: COLORS.textMuted,
            fontWeight: "700",
            letterSpacing: 1.5,
            paddingHorizontal: SPACING.md,
            marginBottom: 8,
          }}
        >
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: RADIUS.xl,
          borderWidth: 1,
          borderColor: COLORS.border,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ─── Alert item ───────────────────────────────────────────────────────────────

function AlertItem({ alert, onDismiss }) {
  const cfgMap = {
    critical: { color: COLORS.danger, Icon: AlertCircle },
    warning: { color: COLORS.warning, Icon: AlertTriangle },
    info: { color: COLORS.info, Icon: Info },
  };
  const cfg = cfgMap[alert.level] || cfgMap.info;
  const AlertIcon = cfg.Icon;

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: 20 }}
      transition={{ type: "timing", duration: 300 }}
      style={{
        backgroundColor: `${cfg.color}0D`,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: `${cfg.color}25`,
        padding: SPACING.md,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <AlertIcon size={16} color={cfg.color} />
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: FONTS.sm, fontWeight: "700", color: cfg.color }}
        >
          {alert.title}
        </Text>
        <Text
          style={{ fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 3 }}
        >
          {alert.message}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onDismiss(alert.id)}>
        <Text style={{ fontSize: 18, color: COLORS.textMuted, lineHeight: 20 }}>
          ×
        </Text>
      </TouchableOpacity>
    </MotiView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const [notifMoisture, setNotifMoisture] = useState(true);
  const [notifObstacle, setNotifObstacle] = useState(true);
  const [notifPH, setNotifPH] = useState(true);
  const [notifTemp, setNotifTemp] = useState(false);
  const [roverName, setRoverName] = useState("Demetrios-01");
  const [refreshInterval, setRefreshInterval] = useState("6");
  const [alerts, setAlerts] = useState([]);

  const dismissAlert = useCallback((id) => {
    Haptics.selectionAsync();
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAlerts([]);
  }, []);

  const { data: sensorData } = useQuery({
    queryKey: ["sensors"],
    queryFn: async () => {
      const res = await fetch("/api/sensors");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    refetchInterval: 8000,
    onSuccess: (data) => {
      const latest = data?.latest;
      if (!latest) return;
      const newAlerts = [];

      if (notifMoisture && latest.moisture < 30) {
        newAlerts.push({
          id: "moisture-low",
          level: "critical",
          title: "Low Soil Moisture",
          message: `Current: ${latest.moisture?.toFixed(1)}% — Irrigation recommended immediately.`,
        });
      }
      if (notifObstacle && latest.ultrasonic < 20) {
        newAlerts.push({
          id: "obstacle",
          level: "critical",
          title: "Obstacle Detected",
          message: `Distance: ${latest.ultrasonic?.toFixed(1)} cm — Rover path blocked.`,
        });
      }
      if (notifPH && (latest.ph < 5.5 || latest.ph > 7.5)) {
        newAlerts.push({
          id: "ph-range",
          level: "warning",
          title: "Soil pH Out of Range",
          message: `Current pH: ${latest.ph?.toFixed(2)} — Optimal range is 5.5–7.5.`,
        });
      }
      if (notifTemp && latest.temperature > 38) {
        newAlerts.push({
          id: "temp-high",
          level: "warning",
          title: "High Temperature",
          message: `Temp: ${latest.temperature?.toFixed(1)}°C — Risk of heat stress.`,
        });
      }

      setAlerts((prev) => {
        const ids = prev.map((a) => a.id);
        const fresh = newAlerts.filter((a) => !ids.includes(a.id));
        return [...prev, ...fresh];
      });
    },
  });

  const resetOnboarding = useCallback(() => {
    Alert.alert(
      "Reset Onboarding",
      "Show the onboarding screens again on next launch?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync("demetrios_onboarded");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Done", "Restart the app to see onboarding.");
          },
        },
      ],
    );
  }, []);

  const activeCount = alerts.length;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
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
                Settings
              </Text>
            </View>
            {activeCount > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: `${COLORS.danger}20`,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: RADIUS.full,
                  borderWidth: 1,
                  borderColor: `${COLORS.danger}35`,
                }}
              >
                <Bell size={13} color={COLORS.danger} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: COLORS.danger,
                  }}
                >
                  {activeCount} ALERT{activeCount > 1 ? "S" : ""}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
          {/* ── Alerts Panel ── */}
          <View style={{ marginBottom: SPACING.lg }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: SPACING.md,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <AlertTriangle
                  size={18}
                  color={activeCount > 0 ? COLORS.danger : COLORS.textMuted}
                />
                <Text
                  style={{
                    fontSize: FONTS.lg,
                    fontWeight: "800",
                    color: COLORS.text,
                  }}
                >
                  Active Alerts
                  {activeCount > 0 && (
                    <Text style={{ color: COLORS.danger }}>
                      {" "}
                      ({activeCount})
                    </Text>
                  )}
                </Text>
              </View>
              {activeCount > 0 && (
                <TouchableOpacity onPress={dismissAll}>
                  <Text
                    style={{
                      fontSize: FONTS.xs,
                      color: COLORS.textMuted,
                      fontWeight: "700",
                    }}
                  >
                    Clear All
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {activeCount > 0 ? (
              <View style={{ gap: SPACING.sm }}>
                {alerts.map((a) => (
                  <AlertItem key={a.id} alert={a} onDismiss={dismissAlert} />
                ))}
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: `${COLORS.primary}0A`,
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: `${COLORS.primary}18`,
                  padding: SPACING.lg,
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <CheckCircle size={32} color={COLORS.primary} />
                <Text
                  style={{
                    fontSize: FONTS.md,
                    fontWeight: "700",
                    color: COLORS.primary,
                  }}
                >
                  All Clear
                </Text>
                <Text
                  style={{
                    fontSize: FONTS.sm,
                    color: COLORS.textMuted,
                    textAlign: "center",
                  }}
                >
                  No active alerts. Your rover and field are healthy.
                </Text>
              </View>
            )}
          </View>

          {/* ── Rover Config ── */}
          <Section title="Rover Configuration">
            <View style={{ padding: SPACING.md, gap: 12 }}>
              <View>
                <Text
                  style={{
                    fontSize: FONTS.xs,
                    color: COLORS.textMuted,
                    marginBottom: 6,
                  }}
                >
                  Rover Name
                </Text>
                <TextInput
                  value={roverName}
                  onChangeText={setRoverName}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    padding: 12,
                    color: COLORS.text,
                    fontSize: FONTS.md,
                    fontWeight: "700",
                  }}
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: FONTS.xs,
                    color: COLORS.textMuted,
                    marginBottom: 6,
                  }}
                >
                  Refresh Interval (seconds)
                </Text>
                <TextInput
                  value={refreshInterval}
                  onChangeText={setRefreshInterval}
                  keyboardType="number-pad"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    padding: 12,
                    color: COLORS.text,
                    fontSize: FONTS.md,
                    fontWeight: "700",
                  }}
                />
              </View>
            </View>
          </Section>

          {/* ── Notifications ── */}
          <Section title="Alerts & Notifications">
            <SettingRow
              icon={Droplets}
              iconColor="#38BDF8"
              label="Low Moisture Alert"
              sublabel="Alert when moisture < 30%"
              isFirst
              right={
                <Switch
                  value={notifMoisture}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setNotifMoisture(v);
                  }}
                  trackColor={{
                    false: "rgba(255,255,255,0.1)",
                    true: "rgba(56,189,248,0.4)",
                  }}
                  thumbColor={
                    notifMoisture ? "#38BDF8" : "rgba(255,255,255,0.5)"
                  }
                />
              }
            />
            <SettingRow
              icon={AlertCircle}
              iconColor={COLORS.danger}
              label="Obstacle Alert"
              sublabel="Alert when ultrasonic < 20 cm"
              right={
                <Switch
                  value={notifObstacle}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setNotifObstacle(v);
                  }}
                  trackColor={{
                    false: "rgba(255,255,255,0.1)",
                    true: "rgba(239,68,68,0.4)",
                  }}
                  thumbColor={
                    notifObstacle ? COLORS.danger : "rgba(255,255,255,0.5)"
                  }
                />
              }
            />
            <SettingRow
              icon={FlaskConical}
              iconColor={COLORS.primary}
              label="pH Range Alert"
              sublabel="Alert when pH < 5.5 or > 7.5"
              right={
                <Switch
                  value={notifPH}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setNotifPH(v);
                  }}
                  trackColor={{
                    false: "rgba(255,255,255,0.1)",
                    true: "rgba(34,197,94,0.4)",
                  }}
                  thumbColor={
                    notifPH ? COLORS.primary : "rgba(255,255,255,0.5)"
                  }
                />
              }
            />
            <SettingRow
              icon={Thermometer}
              iconColor={COLORS.warning}
              label="High Temperature Alert"
              sublabel="Alert when temp > 38°C"
              right={
                <Switch
                  value={notifTemp}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setNotifTemp(v);
                  }}
                  trackColor={{
                    false: "rgba(255,255,255,0.1)",
                    true: "rgba(245,158,11,0.4)",
                  }}
                  thumbColor={
                    notifTemp ? COLORS.warning : "rgba(255,255,255,0.5)"
                  }
                />
              }
            />
          </Section>

          {/* ── System ── */}
          <Section title="System">
            <SettingRow
              icon={Wifi}
              iconColor={COLORS.info}
              label="Connection Status"
              sublabel="Backend API"
              isFirst
              right={
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: `${COLORS.primary}15`,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: RADIUS.full,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: COLORS.primary,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: COLORS.primary,
                    }}
                  >
                    Online
                  </Text>
                </View>
              }
            />
            <SettingRow
              icon={Cpu}
              iconColor={COLORS.accent}
              label="Sensor Readings"
              sublabel={
                sensorData?.history?.length
                  ? `${sensorData.history.length} readings stored`
                  : "No data yet"
              }
              right={
                <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted }}>
                  {sensorData?.history?.length ?? 0}
                </Text>
              }
            />
            <SettingRow
              icon={Shield}
              iconColor="#A78BFA"
              label="Data Security"
              sublabel="All data encrypted in transit"
              right={<CheckCircle size={16} color={COLORS.primary} />}
            />
          </Section>

          {/* ── Danger Zone ── */}
          <Section title="Danger Zone">
            <SettingRow
              icon={RotateCcw}
              iconColor={COLORS.textMuted}
              label="Reset Onboarding"
              sublabel="See the intro screens on next launch"
              isFirst
              onPress={resetOnboarding}
            />
            <SettingRow
              icon={Trash2}
              label="Clear All Alerts"
              danger
              onPress={() => {
                Alert.alert("Clear Alerts", "Remove all active alerts?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => {
                      setAlerts([]);
                      Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success,
                      );
                    },
                  },
                ]);
              }}
            />
          </Section>

          {/* ── About ── */}
          <Section title="About Demetrios">
            <SettingRow
              icon={Leaf}
              iconColor={COLORS.primary}
              label="Demetrios"
              sublabel="Smart Agriculture AI Platform"
              isFirst
              right={
                <View
                  style={{
                    backgroundColor: `${COLORS.primary}15`,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: RADIUS.full,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: COLORS.primary,
                    }}
                  >
                    v{APP_VERSION}
                  </Text>
                </View>
              }
            />
            <SettingRow
              icon={Server}
              iconColor={COLORS.info}
              label="Backend"
              sublabel="Node.js + PostgreSQL (Neon)"
            />
            <SettingRow
              icon={Zap}
              iconColor="#A78BFA"
              label="AI Engine"
              sublabel="Google Gemini 2.5 Flash"
            />
            <SettingRow
              icon={Cpu}
              iconColor={COLORS.warning}
              label="IoT Hardware"
              sublabel="Arduino Mega + ESP32-CAM"
            />
          </Section>

          {/* Footer */}
          <View
            style={{
              alignItems: "center",
              paddingVertical: SPACING.lg,
              gap: 4,
            }}
          >
            <Text
              style={{
                fontSize: FONTS.xs,
                color: COLORS.textDim,
                fontWeight: "600",
              }}
            >
              Demetrios Agricultural AI v{APP_VERSION}
            </Text>
            <Text style={{ fontSize: 10, color: COLORS.textDim }}>
              Built with React Native + Expo • 2026
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
