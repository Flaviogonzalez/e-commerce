import baseConfig from "@repo/ui/tailwind.config";

export default {
  ...baseConfig,
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
