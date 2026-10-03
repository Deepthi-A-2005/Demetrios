import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import { COLORS } from "../utils/theme";

export default function Index() {
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    async function check() {
      try {
        const val = await SecureStore.getItemAsync("demetrios_onboarded");
        setDestination(val === "true" ? "/(tabs)" : "/onboarding");
      } catch {
        setDestination("/onboarding");
      }
    }
    check();
  }, []);

  if (!destination) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
