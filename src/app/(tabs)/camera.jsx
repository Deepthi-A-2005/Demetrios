/**
 * Demetrios — Vision & AI Analysis Tab
 * ESP32-CAM feed, snapshot capture, AI crop health analysis
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MotiView, AnimatePresence } from "moti";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import {
  Camera,
  Leaf,
  Upload,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  History,
  Eye,
  Image as ImageIcon,
  RefreshCw,
  Radio,
} from "lucide-react-native";
import { COLORS, FONTS, SPACING, RADIUS } from "../../utils/theme";
import useUpload from "../../utils/useUpload";

const HEALTH_CONFIG = {
  Good: { color: COLORS.primary, icon: CheckCircle, label: "✓ Healthy" },
  "At Risk": { color: COLORS.warning, icon: AlertTriangle, label: "⚠ At Risk" },
  Poor: { color: COLORS.danger, icon: XCircle, label: "✗ Poor Health" },
};

// ─── Analysis History Card ────────────────────────────────────────────────────

function AnalysisCard({ item, delay }) {
  const cfg = HEALTH_CONFIG[item.health_status] || HEALTH_CONFIG["Good"];
  const Icon = cfg.icon;
  const date = new Date(item.timestamp);
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 400, delay }}
      style={{
        backgroundColor: `${cfg.color}0D`,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: `${cfg.color}25`,
        padding: SPACING.md,
        flexDirection: "row",
        gap: SPACING.md,
        alignItems: "flex-start",
      }}
    >
      {/* Thumbnail */}
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={{
            width: 64,
            height: 64,
            borderRadius: RADIUS.sm,
            backgroundColor: "#111",
          }}
        />
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: RADIUS.sm,
            backgroundColor: "rgba(255,255,255,0.05)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ImageIcon size={24} color={COLORS.textMuted} />
        </View>
      )}
      {/* Content */}
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon size={14} color={cfg.color} />
            <Text
              style={{
                fontSize: FONTS.sm,
                fontWeight: "800",
                color: cfg.color,
              }}
            >
              {cfg.label}
            </Text>
          </View>
          <Text style={{ fontSize: FONTS.xs, color: COLORS.textMuted }}>
            {dateStr} • {timeStr}
          </Text>
        </View>
        <Text
          style={{
            fontSize: FONTS.sm,
            color: COLORS.textMuted,
            marginTop: 6,
            lineHeight: 18,
          }}
          numberOfLines={3}
        >
          {item.recommendation}
        </Text>
      </View>
    </MotiView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [camUrl, setCamUrl] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [liveMode, setLiveMode] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [upload, { loading: uploading }] = useUpload();

  const { data: sensorData } = useQuery({
    queryKey: ["sensors"],
    queryFn: async () => {
      const res = await fetch("/api/sensors");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const {
    data: history,
    isLoading: histLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["analysis"],
    queryFn: async () => {
      const res = await fetch("/api/analysis");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const runAnalysis = useMutation({
    mutationFn: async ({ base64 }) => {
      const sensorSnapshot = sensorData?.latest || {};
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, sensorSnapshot }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      qc.invalidateQueries({ queryKey: ["analysis"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err) => {
      Alert.alert("Analysis Failed", err.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const pickImage = useCallback(async () => {
    Haptics.selectionAsync();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setSelectedAsset(asset);
      setAnalysisResult(null);
    }
  }, []);

  const captureCamera = useCallback(async () => {
    Haptics.selectionAsync();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSelectedAsset(result.assets[0]);
      setAnalysisResult(null);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedAsset?.base64) {
      Alert.alert("No Image", "Please select or capture an image first.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const mimeType = selectedAsset.mimeType || "image/jpeg";
    const base64String = `data:${mimeType};base64,${selectedAsset.base64}`;
    runAnalysis.mutate({ base64: base64String });
  }, [selectedAsset, runAnalysis]);

  const isAnalyzing = runAnalysis.isPending;
  const resultCfg = analysisResult
    ? HEALTH_CONFIG[analysisResult.health_status] || HEALTH_CONFIG["Good"]
    : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            Vision & AI
          </Text>
          <Text
            style={{
              fontSize: FONTS.sm,
              color: COLORS.textMuted,
              marginTop: 4,
            }}
          >
            Upload a crop image for instant AI health analysis
          </Text>
        </LinearGradient>

        <View
          style={{
            paddingHorizontal: SPACING.lg,
            gap: SPACING.lg,
            marginTop: SPACING.lg,
          }}
        >
          {/* Camera mode toggle */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: RADIUS.lg,
              padding: 4,
            }}
          >
            {[
              { label: "Upload Image", active: !liveMode },
              { label: "ESP32-CAM Feed", active: liveMode },
            ].map((tab, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  Haptics.selectionAsync();
                  setLiveMode(i === 1);
                }}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={
                    tab.active
                      ? [COLORS.primary, COLORS.primaryDark]
                      : ["transparent", "transparent"]
                  }
                  style={{
                    paddingVertical: 10,
                    borderRadius: RADIUS.md,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONTS.sm,
                      fontWeight: "700",
                      color: tab.active ? "#fff" : COLORS.textMuted,
                    }}
                  >
                    {tab.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Upload mode ── */}
          {!liveMode && (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 400 }}
            >
              {/* Image preview or placeholder */}
              {selectedAsset ? (
                <View
                  style={{
                    borderRadius: RADIUS.xl,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <Image
                    source={{ uri: selectedAsset.uri }}
                    style={{ width: "100%", height: 240 }}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedAsset(null);
                      setAnalysisResult(null);
                    }}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      borderRadius: RADIUS.full,
                      padding: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>✕ Clear</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View
                  style={{
                    height: 220,
                    borderRadius: RADIUS.xl,
                    borderWidth: 2,
                    borderColor: "rgba(255,255,255,0.1)",
                    borderStyle: "dashed",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: "rgba(255,255,255,0.03)",
                  }}
                >
                  <Camera size={48} color={COLORS.textMuted} />
                  <Text
                    style={{
                      fontSize: FONTS.md,
                      color: COLORS.textMuted,
                      fontWeight: "600",
                    }}
                  >
                    No image selected
                  </Text>
                  <Text
                    style={{
                      fontSize: FONTS.sm,
                      color: COLORS.textDim,
                      textAlign: "center",
                    }}
                  >
                    Tap below to upload or capture a crop photo
                  </Text>
                </View>
              )}

              {/* Pick buttons */}
              <View
                style={{
                  flexDirection: "row",
                  gap: SPACING.sm,
                  marginTop: SPACING.md,
                }}
              >
                <TouchableOpacity
                  onPress={captureCamera}
                  style={{ flex: 1 }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.08)",
                      "rgba(255,255,255,0.04)",
                    ]}
                    style={{
                      borderRadius: RADIUS.lg,
                      paddingVertical: 14,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <Camera size={18} color={COLORS.text} />
                    <Text
                      style={{
                        fontSize: FONTS.sm,
                        fontWeight: "700",
                        color: COLORS.text,
                      }}
                    >
                      Camera
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickImage}
                  style={{ flex: 1 }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.08)",
                      "rgba(255,255,255,0.04)",
                    ]}
                    style={{
                      borderRadius: RADIUS.lg,
                      paddingVertical: 14,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <Upload size={18} color={COLORS.text} />
                    <Text
                      style={{
                        fontSize: FONTS.sm,
                        fontWeight: "700",
                        color: COLORS.text,
                      }}
                    >
                      Gallery
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Analyze button */}
              <TouchableOpacity
                onPress={handleAnalyze}
                disabled={!selectedAsset || isAnalyzing}
                activeOpacity={0.85}
                style={{ marginTop: SPACING.md }}
              >
                <LinearGradient
                  colors={
                    !selectedAsset || isAnalyzing
                      ? ["rgba(34,197,94,0.2)", "rgba(34,197,94,0.1)"]
                      : [COLORS.primary, COLORS.primaryDark]
                  }
                  style={{
                    borderRadius: RADIUS.xl,
                    paddingVertical: 18,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text
                        style={{
                          fontSize: FONTS.lg,
                          fontWeight: "700",
                          color: "#fff",
                        }}
                      >
                        Analyzing with AI...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Zap
                        size={22}
                        color={selectedAsset ? "#fff" : COLORS.textMuted}
                      />
                      <Text
                        style={{
                          fontSize: FONTS.lg,
                          fontWeight: "700",
                          color: selectedAsset ? "#fff" : COLORS.textMuted,
                        }}
                      >
                        Run AI Analysis
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </MotiView>
          )}

          {/* ── ESP32-CAM Live Feed mode ── */}
          {liveMode && (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 400 }}
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: SPACING.lg,
                gap: SPACING.md,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Radio size={16} color={COLORS.danger} />
                <Text
                  style={{
                    fontSize: FONTS.md,
                    fontWeight: "700",
                    color: COLORS.text,
                  }}
                >
                  ESP32-CAM Stream URL
                </Text>
              </View>
              <TextInput
                value={camUrl}
                onChangeText={setCamUrl}
                placeholder="http://192.168.x.x/cam"
                placeholderTextColor={COLORS.textMuted}
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: SPACING.md,
                  color: COLORS.text,
                  fontSize: FONTS.sm,
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {camUrl ? (
                <View style={{ borderRadius: RADIUS.lg, overflow: "hidden" }}>
                  <Image
                    source={{ uri: camUrl }}
                    style={{
                      width: "100%",
                      height: 220,
                      backgroundColor: "#000",
                    }}
                    resizeMode="cover"
                  />
                  <View
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: "rgba(239,68,68,0.9)",
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
                        backgroundColor: "#fff",
                      }}
                    />
                    <Text
                      style={{ fontSize: 11, fontWeight: "800", color: "#fff" }}
                    >
                      LIVE
                    </Text>
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    height: 180,
                    borderRadius: RADIUS.lg,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Eye size={40} color={COLORS.textMuted} />
                  <Text style={{ fontSize: FONTS.sm, color: COLORS.textMuted }}>
                    Enter stream URL above
                  </Text>
                </View>
              )}

              <Text
                style={{
                  fontSize: FONTS.xs,
                  color: COLORS.textMuted,
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                }}
              >
                💡 ESP32-CAM: stream at /stream or /cam
              </Text>
            </MotiView>
          )}

          {/* ── AI Analysis Result ── */}
          <AnimatePresence>
            {analysisResult && resultCfg && (
              <MotiView
                from={{ opacity: 0, scale: 0.94, translateY: 16 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ type: "spring", damping: 16 }}
              >
                <LinearGradient
                  colors={[`${resultCfg.color}18`, `${resultCfg.color}06`]}
                  style={{
                    borderRadius: RADIUS.xl,
                    borderWidth: 1.5,
                    borderColor: `${resultCfg.color}35`,
                    padding: SPACING.lg,
                    gap: SPACING.md,
                  }}
                >
                  {/* Status header */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <resultCfg.icon size={28} color={resultCfg.color} />
                    <View>
                      <Text
                        style={{
                          fontSize: FONTS.xs,
                          color: COLORS.textMuted,
                          fontWeight: "600",
                        }}
                      >
                        AI CROP ANALYSIS
                      </Text>
                      <Text
                        style={{
                          fontSize: FONTS.xxl,
                          fontWeight: "900",
                          color: resultCfg.color,
                          letterSpacing: -0.5,
                        }}
                      >
                        {analysisResult.health_status}
                      </Text>
                    </View>
                  </View>

                  {/* Recommendation */}
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      borderRadius: RADIUS.md,
                      padding: SPACING.md,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: FONTS.xs,
                        color: COLORS.textMuted,
                        fontWeight: "700",
                        marginBottom: 6,
                      }}
                    >
                      AGRONOMIST RECOMMENDATION
                    </Text>
                    <Text
                      style={{
                        fontSize: FONTS.sm,
                        color: COLORS.text,
                        lineHeight: 22,
                      }}
                    >
                      {analysisResult.recommendation}
                    </Text>
                  </View>

                  {/* Sensor snapshot */}
                  {analysisResult.sensor_snapshot && (
                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                    >
                      {Object.entries(analysisResult.sensor_snapshot)
                        .slice(0, 4)
                        .map(([k, v]) => (
                          <View
                            key={k}
                            style={{
                              backgroundColor: "rgba(255,255,255,0.05)",
                              borderRadius: RADIUS.sm,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                            <Text
                              style={{ fontSize: 10, color: COLORS.textMuted }}
                            >
                              {k}
                            </Text>
                            <Text
                              style={{
                                fontSize: FONTS.sm,
                                fontWeight: "700",
                                color: COLORS.text,
                              }}
                            >
                              {typeof v === "number" ? v.toFixed(1) : v}
                            </Text>
                          </View>
                        ))}
                    </View>
                  )}
                </LinearGradient>
              </MotiView>
            )}
          </AnimatePresence>

          {/* ── Analysis History ── */}
          <View>
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
                <History size={18} color={COLORS.textMuted} />
                <Text
                  style={{
                    fontSize: FONTS.lg,
                    fontWeight: "800",
                    color: COLORS.text,
                  }}
                >
                  Analysis History
                </Text>
              </View>
              <TouchableOpacity onPress={() => refetchHistory()}>
                <RefreshCw size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {histLoading ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ marginTop: 20 }}
              />
            ) : history?.length > 0 ? (
              <View style={{ gap: SPACING.sm }}>
                {history.map((item, i) => (
                  <AnalysisCard key={item.id} item={item} delay={i * 60} />
                ))}
              </View>
            ) : (
              <View
                style={{
                  padding: SPACING.xl,
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: COLORS.bgCard,
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Leaf size={36} color={COLORS.textMuted} />
                <Text
                  style={{
                    fontSize: FONTS.md,
                    color: COLORS.textMuted,
                    textAlign: "center",
                  }}
                >
                  No analyses yet.{"\n"}Capture a crop image to get started.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
