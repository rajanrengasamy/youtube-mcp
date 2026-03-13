import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { colors, fonts, springs } from "../lib/theme";

const stats = [
  { icon: "⚡", label: "TypeScript-native", accent: colors.cyan },
  { icon: "◎", label: "Zero config", accent: colors.cyan },
  { icon: "◈", label: "Token optimized", accent: colors.purple },
  { icon: "✦", label: "Actually intelligent", accent: colors.green },
];

export const PositioningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Underline on "Actually intelligent"
  const underlineProgress = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(56,189,248,0.05), transparent 70%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        {/* 2x2 grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            width: 640,
          }}
        >
          {stats.map((stat, i) => {
            const statIn = spring({
              frame,
              fps,
              delay: 10 + i * 12,
              config: springs.gentle,
            });

            const isLast = i === stats.length - 1;

            return (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: "rgba(15,17,26,0.9)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 50,
                  padding: "14px 28px",
                  opacity: interpolate(statIn, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(statIn, [0, 1], [16, 0])}px)`,
                }}
              >
                <span style={{ fontSize: 18, color: stat.accent }}>
                  {stat.icon}
                </span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: colors.white,
                    fontFamily: fonts.mono,
                    letterSpacing: "-0.01em",
                    position: "relative",
                  }}
                >
                  {stat.label}
                  {isLast && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: -3,
                        left: 0,
                        width: "100%",
                        height: 2,
                        background: `linear-gradient(90deg, ${colors.green}, ${colors.cyan})`,
                        transformOrigin: "left",
                        transform: `scaleX(${underlineProgress})`,
                        borderRadius: 1,
                      }}
                    />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
