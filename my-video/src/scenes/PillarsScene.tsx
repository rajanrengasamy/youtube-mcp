import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { colors, fonts, springs } from "../lib/theme";
import { GlowCard } from "../components/GlowCard";

const pillars = [
  {
    icon: "❯_",
    title: "Zero Config",
    desc: "npx tube-mcp. That's it. Works instantly — no API key, no env vars, no OAuth.",
    accent: colors.cyan,
    iconBg: "rgba(56,189,248,0.1)",
  },
  {
    icon: "✦",
    title: "Semantic Search",
    desc: "Search by meaning across entire playlists. Not just titles — the actual content.",
    accent: colors.purple,
    iconBg: "rgba(167,139,250,0.1)",
  },
  {
    icon: "◈",
    title: "Always Works",
    desc: "Three-tier fallback: API → yt-dlp → scrape. Your transcripts, delivered.",
    accent: colors.green,
    iconBg: "rgba(34,197,94,0.1)",
  },
];

export const PillarsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingIn = spring({
    frame,
    fps,
    delay: 5,
    config: springs.gentle,
  });

  // Card 2 (Semantic Search) lifts at frame 120 to draw attention
  const card2Lift = interpolate(frame, [120, 140], [0, -4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${colors.surface} 0%, ${colors.bg} 70%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 40,
        }}
      >
        {/* Section label */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: colors.cyan,
            fontFamily: fonts.kicker,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            opacity: interpolate(headingIn, [0, 1], [0, 1]),
          }}
        >
          Why it&apos;s different
        </div>

        {/* Cards */}
        <div style={{ display: "flex", gap: 24 }}>
          {pillars.map((pillar, i) => {
            // Icon pulse after landing
            const pulseScale =
              frame > 60 + i * 8
                ? 1 +
                  Math.sin((frame - 60 - i * 8) * 0.15) * 0.05
                : 1;

            return (
              <div
                key={pillar.title}
                style={{
                  transform:
                    i === 1 ? `translateY(${card2Lift}px)` : undefined,
                }}
              >
                <GlowCard
                  delay={20 + i * 8}
                  width={280}
                  accentColor={pillar.accent}
                  springConfig={springs.entrance}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: 14,
                    }}
                  >
                    {/* Icon box */}
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        backgroundColor: pillar.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                        color: pillar.accent,
                        fontFamily: fonts.mono,
                        fontWeight: 700,
                        transform: `scale(${pulseScale})`,
                      }}
                    >
                      {pillar.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: colors.white,
                        fontFamily: fonts.display,
                      }}
                    >
                      {pillar.title}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: colors.muted,
                        fontFamily: fonts.body,
                        lineHeight: 1.6,
                      }}
                    >
                      {pillar.desc}
                    </div>
                  </div>
                </GlowCard>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
