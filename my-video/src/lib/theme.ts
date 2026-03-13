import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSyne } from "@remotion/google-fonts/Syne";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: interFamily } = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const { fontFamily: jbMonoFamily } = loadJetBrainsMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

const { fontFamily: syneFamily } = loadSyne("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

const { fontFamily: plexFamily } = loadIBMPlexMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export const fonts = {
  display: syneFamily,
  body: interFamily,
  mono: jbMonoFamily,
  kicker: plexFamily,
};

export const colors = {
  bg: "#07080d",
  surface: "#0f111a",
  surface2: "#151822",
  cyan: "#38bdf8",
  blue: "#6366f1",
  purple: "#a78bfa",
  green: "#22c55e",
  red: "#ef4444",
  amber: "#f59e0b",
  white: "#f0f4ff",
  muted: "#64748b",
  border: "rgba(99,110,180,0.18)",
  borderGlow: "rgba(56,189,248,0.22)",
  cyanBlue: "linear-gradient(135deg, #38bdf8, #6366f1)",
};

export const springs = {
  entrance: { damping: 14, stiffness: 120 },
  slam: { damping: 8, stiffness: 200 },
  float: { damping: 20, stiffness: 80 },
  gentle: { damping: 18, stiffness: 100 },
};
