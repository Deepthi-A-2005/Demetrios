import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import {
  Bot,
  Cpu,
  Leaf,
  Droplets,
  Thermometer,
  Joystick,
  Zap,
  ChevronRight,
  Check,
} from "lucide-react-native";
import { COLORS, RADIUS, FONTS, SPACING } from "../utils/theme";

const { width } = Dimensions.get("window");

const LOGO_URL =
  "https://raw.createusercontent.com/74dbe1ca-09dd-480e-b0f6-09fb481081b4/";

const SLIDES = [
  {
    id: "1",
    emoji: "🌱",
    logoUrl: LOGO_URL,
    icon: Bot,
    title: "Meet Demetrios",
    subtitle: "Your AI-Powered Agriculture Rover",
    description:
      "Monitor your fields in real-time with intelligent sensors, AI crop analysis, and remote rover control — all from your phone.",
    gradient: ["#060D07", "#0A1F10"],
    accent: COLORS.primary,
    features: ["ESP32-CAM Vision", "AI Crop Analysis", "Real-Time Sensors"],
  },
  {
    id: "2",
    emoji: "📡",
    icon: Cpu,
    title: "Smart Monitoring",
    subtitle: "Sensor Intelligence at Your Fingertips",
    description:
      "Track soil moisture, temperature, humidity, pH, and obstacle distance from your Arduino Mega in real-time.",
    gradient: ["#060D07", "#0A0F1F"],
    accent: "#38BDF8",
    features: ["Soil Moisture %", "Temp & Humidity", "pH Analysis"],
  },
  {
    id: "3",
    emoji: "🚜",
    icon: Joystick,
    title: "Take Control",
    subtitle: "Drive Your Rover Anywhere",
    description:
      "Navigate your field remotely with the intuitive D-pad controller. Toggle smart irrigation and let AI guide your decisions.",
    gradient: ["#060D07", "#1F100A"],
    accent: "#A3E635",
    features: ["Remote Navigation", "Smart Irrigation", "GPS Tracking"],
  },
];

function Slide({ item }) {
  const Icon = item.icon;
  return (
    <View style={{ width, paddingHorizontal: SPACING.lg }}>
      {/* Icon hero */}
      <MotiView
        from={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 14, delay: 200 }}
        style={{ alignItems: "center", marginTop: 60 }}
      >
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: `${item.accent}18`,
            borderWidth: 1.5,
            borderColor: `${item.accent}40`,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={[`${item.accent}30`, `${item.accent}08`]}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: 60,
            }}
          />
          {item.logoUrl ? (
            <Image
              source={{ uri: item.logoUrl }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
              contentFit="cover"
            />
          ) : (
            <Text style={{ fontSize: 48 }}>{item.emoji}</Text>
          )}
        </View>
      </MotiView>

      {/* Title */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 350 }}
        style={{ alignItems: "center", marginTop: SPACING.xl }}
      >
        <Text
          style={{
            fontSize: FONTS.display,
            fontWeight: "800",
            color: COLORS.text,
            textAlign: "center",
            letterSpacing: -0.5,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: FONTS.md,
            color: item.accent,
            textAlign: "center",
            marginTop: 6,
            fontWeight: "600",
          }}
        >
          {item.subtitle}
        </Text>
      </MotiView>

      {/* Description */}
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 450 }}
        style={{ marginTop: SPACING.lg }}
      >
        <Text
          style={{
            fontSize: FONTS.md,
            color: COLORS.textMuted,
            textAlign: "center",
            lineHeight: 24,
          }}
        >
          {item.description}
        </Text>
      </MotiView>

      {/* Feature pills */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 550 }}
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 10,
          marginTop: SPACING.xl,
        }}
      >
        {item.features.map((f) => (
          <View
            key={f}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: `${item.accent}12`,
              borderWidth: 1,
              borderColor: `${item.accent}30`,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: RADIUS.full,
            }}
          >
            <Check size={12} color={item.accent} />
            <Text
              style={{
                color: item.accent,
                fontSize: FONTS.sm,
                fontWeight: "600",
              }}
            >
              {f}
            </Text>
          </View>
        ))}
      </MotiView>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const flatRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      await SecureStore.setItemAsync("demetrios_onboarded", "true");
    } catch {}
    router.replace("/(tabs)");
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const onMomentumScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(idx);
  };

  const currentSlide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <LinearGradient
      colors={currentSlide.gradient}
      style={{ flex: 1, paddingTop: insets.top }}
    >
      {/* Skip button */}
      <View
        style={{
          alignItems: "flex-end",
          paddingHorizontal: SPACING.lg,
          paddingTop: 16,
        }}
      >
        {!isLast && (
          <TouchableOpacity onPress={finishOnboarding}>
            <Text
              style={{
                color: COLORS.textMuted,
                fontSize: FONTS.sm,
                fontWeight: "600",
              }}
            >
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Slide item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      />

      {/* Bottom controls */}
      <View
        style={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: insets.bottom + 24,
          gap: 28,
        }}
      >
        {/* Dots */}
        <View
          style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}
        >
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={i}
                style={{
                  width: dotWidth,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentSlide.accent,
                  opacity: dotOpacity,
                }}
              />
            );
          })}
        </View>

        {/* CTA button */}
        <TouchableOpacity onPress={goNext} activeOpacity={0.85}>
          <LinearGradient
            colors={
              isLast
                ? [COLORS.primary, COLORS.primaryDark]
                : [`${currentSlide.accent}22`, `${currentSlide.accent}10`]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 18,
              borderRadius: RADIUS.xl,
              borderWidth: isLast ? 0 : 1,
              borderColor: `${currentSlide.accent}40`,
              gap: 10,
            }}
          >
            <Text
              style={{
                fontSize: FONTS.lg,
                fontWeight: "700",
                color: isLast ? "#fff" : currentSlide.accent,
              }}
            >
              {isLast ? "Launch Demetrios" : "Continue"}
            </Text>
            {isLast ? (
              <Zap size={20} color="#fff" />
            ) : (
              <ChevronRight size={20} color={currentSlide.accent} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
