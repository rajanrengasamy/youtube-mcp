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

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Red flash at start (TV static hit)
  const flashOpacity = interpolate(frame, [0, 6], [0.12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Line 1: "Every Video MCP Server"
  const line1In = spring({ frame, fps, delay: 4, config: springs.slam });

  // Line 2: "is broken." — larger, red, 6 frames later
  const line2In = spring({ frame, fps, delay: 10, config: springs.slam });
  const line2Scale = interpolate(line2In, [0, 0.5, 1], [1.08, 1.08, 1.0]);

  // Period strobe at frame 78–84
  const dotStrobe =
    frame >= 78 && frame <= 84
      ? interpolate(frame, [78, 80, 82, 84], [0, 1, 0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  // Underline draws left→right on "broken"
  const underlineProgress = interpolate(frame, [90, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Exit fade
  const exitOpacity = interpolate(frame, [100, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Red flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.red,
          opacity: flashOpacity,
        }}
      />
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(56,189,248,0.06), transparent 70%)",
        }}
      />
      {/* Grid lines for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          opacity: exitOpacity,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: colors.white,
            fontFamily: fonts.display,
            textAlign: "center",
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            opacity: interpolate(line1In, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(line1In, [0, 1], [60, 0])}px)`,
          }}
        >
          Every Video MCP Server
        </div>

        {/* Line 2 — bigger, red, with glow */}
        <div
          style={{
            fontSize: 90,
            fontWeight: 800,
            fontFamily: fonts.display,
            textAlign: "center",
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            marginTop: 8,
            opacity: interpolate(line2In, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(line2In, [0, 1], [60, 0])}px) scale(${line2Scale})`,
          }}
        >
          <span style={{ color: colors.white }}>is </span>
          <span
            style={{
              color: colors.red,
              textShadow: "0 0 40px rgba(239,68,68,0.6)",
              position: "relative",
              display: "inline-block",
            }}
          >
            broken
            <span
              style={{
                position: "absolute",
                bottom: -4,
                left: 0,
                width: "100%",
                height: 2,
                backgroundColor: colors.red,
                transformOrigin: "left",
                transform: `scaleX(${underlineProgress})`,
              }}
            />
          </span>
          <span style={{ color: colors.red, opacity: dotStrobe }}>.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
