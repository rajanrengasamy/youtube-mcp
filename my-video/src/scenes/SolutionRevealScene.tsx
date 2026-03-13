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

export const SolutionRevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Radial gradient bloom
  const bloomRadius = interpolate(frame, [0, 60], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Play icon entrance
  const iconIn = spring({ frame, fps, delay: 15, config: springs.slam });
  const iconRotation = interpolate(iconIn, [0, 1], [-8, 0]);

  // Product name entrance
  const nameIn = spring({ frame, fps, delay: 25, config: springs.entrance });

  // Subtitle
  const subtitleIn = spring({ frame, fps, delay: 40, config: springs.gentle });

  // Glow halo behind name
  const haloScale = interpolate(frame, [20, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Horizontal rule draw
  const ruleWidth = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Exit
  const exitScale = interpolate(frame, [140, 150], [1, 0.97], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitOpacity = interpolate(frame, [140, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Animated radial bloom */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "40%",
          width: bloomRadius * 2,
          height: bloomRadius,
          marginLeft: -bloomRadius,
          marginTop: -bloomRadius / 2,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(56,189,248,0.12), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x = 640 + Math.sin(frame * 0.02 + i * 2) * (80 + i * 25);
        const y = 720 - ((frame * 0.5 + i * 90) % 800);
        const size = 2 + (i % 3);
        const particleOpacity = interpolate(frame, [20, 50], [0, 0.4], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: colors.cyan,
              opacity: particleOpacity * (0.3 + (i % 3) * 0.15),
            }}
          />
        );
      })}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Play icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: colors.cyanBlue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            boxShadow:
              "0 0 30px rgba(56,189,248,0.5), 0 0 60px rgba(56,189,248,0.25)",
            opacity: interpolate(iconIn, [0, 1], [0, 1]),
            transform: `scale(${interpolate(iconIn, [0, 1], [0, 1])}) rotate(${iconRotation}deg)`,
          }}
        >
          <span style={{ color: "#fff", fontSize: 22, marginLeft: 3 }}>
            ▶
          </span>
        </div>

        {/* Glow halo */}
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 80,
            borderRadius: "50%",
            background: "rgba(56,189,248,0.12)",
            filter: "blur(40px)",
            transform: `scaleX(${haloScale})`,
          }}
        />

        {/* Product name: "tube-" white, "mcp" gradient */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            fontFamily: fonts.mono,
            letterSpacing: "-0.02em",
            opacity: interpolate(nameIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(nameIn, [0, 1], [30, 0])}px)`,
          }}
        >
          <span style={{ color: colors.white }}>tube-</span>
          <span
            style={{
              background: colors.cyanBlue,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            mcp
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: colors.muted,
            fontFamily: fonts.body,
            marginTop: 12,
            letterSpacing: "0.01em",
            opacity: interpolate(subtitleIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(subtitleIn, [0, 1], [15, 0])}px)`,
          }}
        >
          The Video Intelligence Layer for MCP
        </div>

        {/* Horizontal rule */}
        <div
          style={{
            width: 320,
            height: 1,
            marginTop: 24,
            background:
              "linear-gradient(90deg, transparent, rgba(56,189,248,0.4), transparent)",
            transformOrigin: "center",
            transform: `scaleX(${ruleWidth})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
