import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.demetrios.fieldrover",
  appName: "Demetrios",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
