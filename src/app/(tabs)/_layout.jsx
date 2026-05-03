import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LayoutDashboard,
  Joystick,
  Camera,
  TrendingUp,
  Settings,
} from "lucide-react-native";
import { COLORS, FONTS } from "../../utils/theme";

const TAB_ITEMS = [
  { name: "index", label: "Dashboard", icon: LayoutDashboard },
  { name: "control", label: "Control", icon: Joystick },
  { name: "camera", label: "Vision", icon: Camera },
  { name: "analytics", label: "Analytics", icon: TrendingUp },
  { name: "settings", label: "Settings", icon: Settings },
];

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      <BlurView
        intensity={80}
        tint="dark"
        style={{
          flexDirection: "row",
          paddingTop: 10,
          paddingBottom: insets.bottom + 6,
          paddingHorizontal: 8,
          borderTopWidth: 0.5,
          borderTopColor: "rgba(255,255,255,0.08)",
          backgroundColor:
            Platform.OS === "android" ? "rgba(8,15,8,0.98)" : "transparent",
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const meta = TAB_ITEMS.find((t) => t.name === route.name);
          if (!meta) return null;

          const isFocused = state.index === index;
          const Icon = meta.icon;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: "center", gap: 4 }}
            >
              {/* Active indicator dot */}
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: isFocused ? COLORS.primary : "transparent",
                  marginBottom: 2,
                }}
              />
              {/* Icon */}
              <View
                style={{
                  width: 44,
                  height: 36,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: isFocused
                    ? `${COLORS.primary}18`
                    : "transparent",
                }}
              >
                <Icon
                  size={22}
                  color={isFocused ? COLORS.primary : COLORS.tabInactive}
                  strokeWidth={isFocused ? 2.2 : 1.8}
                />
              </View>
              {/* Label */}
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isFocused ? "700" : "500",
                  color: isFocused ? COLORS.primary : COLORS.tabInactive,
                  letterSpacing: 0.2,
                }}
              >
                {meta.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TAB_ITEMS.map((item) => (
        <Tabs.Screen key={item.name} name={item.name} />
      ))}
    </Tabs>
  );
}
