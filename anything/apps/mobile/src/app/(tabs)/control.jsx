/**
 * Demetrios — Rover Control Tab
 * D-pad navigation, speed, watering, auto-patrol controls
 */
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Animated,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Square,
  Droplets,
  Wifi,
  WifiOff,
  Zap,
  RotateCcw,
  Activity,
  Navigation,
  Radio,
} from "lucide-react-native";
import { COLORS, FONTS, SPACING, RADIUS } from "../../utils/theme";

const COMMANDS = ["FORWARD", "BACKWARD", "LEFT", "RIGHT", "STOP"];

// ─── Command button ───────────────────────────────────────────────────────────

function DPadButton({
  icon: Icon,
  command,
  activeCommand,
  onPress,
  size = 58,
  style,
}) {
  const isActive = activeCommand === command;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress(command);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={
            isActive
              ? [COLORS.primary, COLORS.primaryDark]
              : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]
          }
          style={{
            width: size,
            height: size,
            borderRadius: size / 4,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: isActive ? COLORS.primary : "rgba(255,255,255,0.1)",
          }}
        >
          <Icon
            size={size * 0.42}
            color={isActive ? "#fff" : COLORS.textMuted}
          />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Speed indicator ──────────────────────────────────────────────────────────

function SpeedIndicator({ speed }) {
  const levels = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: "row", gap: 5, alignItems: "flex-end" }}>
      {levels.map((l) => (
        <View
          key={l}
          style={{
            width: 8,
            height: 6 + l * 5,
            borderRadius: 2,
            backgroundColor:
              l <= speed ? COLORS.primary : "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ControlScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [speed, setSpeed] = useState(3);

  const { data: roverData, isError } = useQuery({
    queryKey: ["rover"],
    queryFn: async () => {
      const res = await fetch("/api/rover");
      if (!res.ok) throw new Error("Rover fetch failed");
      return res.json();
    },
    refetchInterval: 3000,
  });

  const sendCommand = useMutation({
    mutationFn: async (body) => {
      const res = await fetch("/api/rover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Command failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rover"] });
    },
    onError: () => {
      Alert.alert(
        "Connection Error",
        "Could not reach the rover. Check your network.",
      );
    },
  });

  const handleCommand = useCallback(
    (command) => {
      sendCommand.mutate({ command });
    },
    [sendCommand],
  );

  const handleWateringToggle = useCallback(
    (val) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      sendCommand.mutate({ is_watering: val });
    },
    [sendCommand],
  );

  const isConnected = !isError;
  const currentCommand = roverData?.command ?? "STOP";
  const isWatering = roverData?.is_watering ?? false;

  const DPAD_SIZE = 62;

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
                DEMETRIOS
              </Text>
              <Text
                style={{
                  fontSize: FONTS.xxl,
                  fontWeight: "900",
                  color: COLORS.text,
                  letterSpacing: -0.5,
                }}
              >
                Rover Control
              </Text>
            </View>
            {/* Status */}
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
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
                  <Wifi size={13} color={COLORS.primary} />
                ) : (
                  <WifiOff size={13} color={COLORS.danger} />
                )}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: isConnected ? COLORS.primary : COLORS.danger,
                  }}
                >
                  {isConnected ? "CONNECTED" : "OFFLINE"}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View
          style={{
            paddingHorizontal: SPACING.lg,
            gap: SPACING.lg,
            marginTop: SPACING.lg,
          }}
        >
          {/* Current status card */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 450 }}
          >
            <LinearGradient
              colors={["rgba(34,197,94,0.12)", "rgba(34,197,94,0.03)"]}
              style={{
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: `${COLORS.primary}25`,
                padding: SPACING.lg,
              }}
            >
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
                    }}
                  >
                    CURRENT STATE
                  </Text>
                  <Text
                    style={{
                      fontSize: FONTS.xxxl,
                      fontWeight: "900",
                      color: COLORS.primary,
                      letterSpacing: -1,
                      marginTop: 4,
                    }}
                  >
                    {currentCommand}
                  </Text>
                </View>
                <View style={{ alignItems: "center", gap: 8 }}>
                  <Navigation size={32} color={COLORS.primary} />
                  <SpeedIndicator speed={speed} />
                  <Text style={{ fontSize: FONTS.xs, color: COLORS.textMuted }}>
                    Speed {speed}/5
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </MotiView>

          {/* D-Pad Controller */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 16, delay: 150 }}
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: SPACING.xl,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text
              style={{
                fontSize: FONTS.xs,
                color: COLORS.textMuted,
                fontWeight: "600",
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              NAVIGATION
            </Text>

            {/* Row: UP */}
            <DPadButton
              icon={ArrowUp}
              command="FORWARD"
              activeCommand={currentCommand}
              onPress={handleCommand}
              size={DPAD_SIZE}
            />

            {/* Row: LEFT | STOP | RIGHT */}
            <View
              style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
            >
              <DPadButton
                icon={ArrowLeft}
                command="LEFT"
                activeCommand={currentCommand}
                onPress={handleCommand}
                size={DPAD_SIZE}
              />
              <DPadButton
                icon={Square}
                command="STOP"
                activeCommand={currentCommand}
                onPress={handleCommand}
                size={DPAD_SIZE + 8}
              />
              <DPadButton
                icon={ArrowRight}
                command="RIGHT"
                activeCommand={currentCommand}
                onPress={handleCommand}
                size={DPAD_SIZE}
              />
            </View>

            {/* Row: DOWN */}
            <DPadButton
              icon={ArrowDown}
              command="BACKWARD"
              activeCommand={currentCommand}
              onPress={handleCommand}
              size={DPAD_SIZE}
            />

            {/* Command legend */}
            <View
              style={{
                flexDirection: "row",
                gap: SPACING.sm,
                marginTop: SPACING.md,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {COMMANDS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => handleCommand(c)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: RADIUS.full,
                    backgroundColor:
                      currentCommand === c
                        ? `${COLORS.primary}20`
                        : "rgba(255,255,255,0.05)",
                    borderWidth: 1,
                    borderColor:
                      currentCommand === c
                        ? `${COLORS.primary}40`
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONTS.xs,
                      fontWeight: "700",
                      color:
                        currentCommand === c
                          ? COLORS.primary
                          : COLORS.textMuted,
                    }}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </MotiView>

          {/* Speed control */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
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
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: SPACING.md,
              }}
            >
              <Text
                style={{
                  fontSize: FONTS.md,
                  fontWeight: "700",
                  color: COLORS.text,
                }}
              >
                Speed Level
              </Text>
              <Text
                style={{
                  fontSize: FONTS.xl,
                  fontWeight: "900",
                  color: COLORS.primary,
                }}
              >
                {speed}/5
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSpeed(l);
                  }}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={
                      l <= speed
                        ? [COLORS.primary, COLORS.primaryDark]
                        : ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.03)"]
                    }
                    style={{
                      height: 8 + l * 8,
                      borderRadius: 4,
                      alignSelf: "flex-end",
                      width: "100%",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      color: l <= speed ? COLORS.primary : COLORS.textMuted,
                      textAlign: "center",
                      marginTop: 6,
                      fontWeight: "700",
                    }}
                  >
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </MotiView>

          {/* Watering toggle */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 450, delay: 250 }}
          >
            <LinearGradient
              colors={
                isWatering
                  ? ["rgba(56,189,248,0.15)", "rgba(56,189,248,0.04)"]
                  : [COLORS.bgCard, COLORS.bgCard]
              }
              style={{
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: isWatering
                  ? "rgba(56,189,248,0.3)"
                  : COLORS.border,
                padding: SPACING.lg,
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.md,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: isWatering
                    ? "rgba(56,189,248,0.2)"
                    : "rgba(255,255,255,0.06)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Droplets
                  size={24}
                  color={isWatering ? COLORS.info : COLORS.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: FONTS.md,
                    fontWeight: "700",
                    color: COLORS.text,
                  }}
                >
                  Smart Irrigation
                </Text>
                <Text
                  style={{
                    fontSize: FONTS.sm,
                    color: COLORS.textMuted,
                    marginTop: 2,
                  }}
                >
                  {isWatering
                    ? "Watering in progress..."
                    : "Tap to start watering"}
                </Text>
              </View>
              <Switch
                value={isWatering}
                onValueChange={handleWateringToggle}
                trackColor={{
                  false: "rgba(255,255,255,0.1)",
                  true: "rgba(56,189,248,0.4)",
                }}
                thumbColor={isWatering ? COLORS.info : "rgba(255,255,255,0.5)"}
              />
            </LinearGradient>
          </MotiView>

          {/* Auto-patrol mode */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 450, delay: 300 }}
          >
            <LinearGradient
              colors={[`${COLORS.accent}10`, "transparent"]}
              style={{
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: `${COLORS.accent}20`,
                padding: SPACING.lg,
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.md,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: `${COLORS.accent}15`,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <RotateCcw size={24} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: FONTS.md,
                    fontWeight: "700",
                    color: COLORS.text,
                  }}
                >
                  Auto-Patrol Mode
                </Text>
                <Text
                  style={{
                    fontSize: FONTS.sm,
                    color: COLORS.textMuted,
                    marginTop: 2,
                  }}
                >
                  Autonomous field scanning
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: `${COLORS.accent}15`,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: RADIUS.full,
                }}
              >
                <Text
                  style={{
                    fontSize: FONTS.xs,
                    fontWeight: "700",
                    color: COLORS.accent,
                  }}
                >
                  BETA
                </Text>
              </View>
            </LinearGradient>
          </MotiView>

          {/* Telemetry cards */}
          <View>
            <Text
              style={{
                fontSize: FONTS.lg,
                fontWeight: "800",
                color: COLORS.text,
                marginBottom: SPACING.md,
              }}
            >
              Telemetry
            </Text>
            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
              {[
                {
                  label: "Command",
                  value: currentCommand,
                  icon: Radio,
                  color: COLORS.primary,
                },
                {
                  label: "Watering",
                  value: isWatering ? "ON" : "OFF",
                  icon: Droplets,
                  color: COLORS.info,
                },
                {
                  label: "Status",
                  value: isConnected ? "Online" : "Offline",
                  icon: Activity,
                  color: isConnected ? COLORS.primary : COLORS.danger,
                },
              ].map((t) => (
                <View
                  key={t.label}
                  style={{
                    flex: 1,
                    backgroundColor: `${t.color}10`,
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: `${t.color}20`,
                    padding: SPACING.md,
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <t.icon size={18} color={t.color} />
                  <Text
                    style={{
                      fontSize: 11,
                      color: COLORS.textMuted,
                      fontWeight: "600",
                    }}
                  >
                    {t.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: FONTS.sm,
                      fontWeight: "800",
                      color: t.color,
                      textAlign: "center",
                    }}
                  >
                    {t.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
