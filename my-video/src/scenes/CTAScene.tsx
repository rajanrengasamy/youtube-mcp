import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { colors, fonts, springs } from "../lib/theme";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Icon entrance
  const iconIn = spring({ frame, fps, delay: 10, config: springs.slam });
  const iconRotation = interpolate(iconIn, [0, 1], [-8, 0]);
  // Idle pulse after landing
  const iconPulse = frame > 30 ? 1 + Math.sin(frame * 0.08) * 0.03 : 1;

  // Product name
  const nameIn = spring({ frame, fps, delay: 25, config: springs.entrance });
  // Glow pulse on text
  const textGlow =
    frame > 80
      ? 20 + Math.sin(frame * 0.06) * 15
      : interpolate(frame, [25, 80], [0, 20], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Tagline
  const taglineIn = spring({ frame, fps, delay: 40, config: springs.gentle });

  // Badge
  const badgeIn = spring({ frame, fps, delay: 60, config: springs.entrance });
  const badgeBorderOpacity =
    frame > 80
      ? 0.3 + Math.sin(frame * 0.05) * 0.15
      : 0.3;

  // Question
  const questionIn = spring({
    frame,
    fps,
    delay: 90,
    config: springs.entrance,
  });

  // CTA arrow bounce
  const arrowBounce =
    frame > 110
      ? Math.sin(frame * 0.1) * 4
      : 0;

  // CTA text
  const ctaIn = spring({ frame, fps, delay: 110, config: springs.gentle });

  // Hold then fade
  const exitOpacity = interpolate(frame, [200, 210], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background glow
  const glowPulse =
    frame > 20
      ? 0.06 + Math.sin(frame * 0.04) * 0.03
      : interpolate(frame, [0, 20], [0, 0.06], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, rgba(56,189,248,${glowPulse}), transparent 70%)`,
        }}
      />

      {/* Particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x = 640 + Math.sin(frame * 0.015 + i * 2.5) * (60 + i * 20);
        const y = 720 - ((frame * 0.4 + i * 90) % 800);
        const size = 2 + (i % 3);
        const pOpacity = interpolate(frame, [10, 40], [0, 0.3], {
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
              opacity: pOpacity * (0.2 + (i % 3) * 0.15),
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
          gap: 0,
          opacity: exitOpacity,
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
            transform: `scale(${interpolate(iconIn, [0, 1], [0, 1]) * iconPulse}) rotate(${iconRotation}deg)`,
          }}
        >
          <span style={{ color: "#fff", fontSize: 22, marginLeft: 3 }}>
            ▶
          </span>
        </div>

        {/* Product name */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            fontFamily: fonts.mono,
            letterSpacing: "-0.02em",
            opacity: interpolate(nameIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(nameIn, [0, 1], [30, 0])}px)`,
            filter: `drop-shadow(0 0 ${textGlow}px rgba(56,189,248,0.4))`,
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

        {/* Tagline */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: colors.muted,
            fontFamily: fonts.body,
            letterSpacing: "0.01em",
            marginTop: 8,
            opacity: interpolate(taglineIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(taglineIn, [0, 1], [15, 0])}px)`,
          }}
        >
          The Video Intelligence Layer for MCP
        </div>

        {/* Coming Soon badge */}
        <div
          style={{
            marginTop: 24,
            opacity: interpolate(badgeIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(badgeIn, [0, 1], [12, 0])}px)`,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "8px 20px",
              borderRadius: 50,
              backgroundColor: "rgba(56,189,248,0.08)",
              border: `1px solid rgba(56,189,248,${badgeBorderOpacity})`,
              fontSize: 11,
              fontWeight: 500,
              color: colors.cyan,
              fontFamily: fonts.kicker,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Coming Soon
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            marginTop: 32,
            fontSize: 40,
            fontWeight: 800,
            color: colors.white,
            fontFamily: fonts.display,
            letterSpacing: "-0.02em",
            opacity: interpolate(questionIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(questionIn, [0, 1], [24, 0])}px)`,
          }}
        >
          Would you use this?
        </div>

        {/* CTA with bouncing arrow */}
        <div
          style={{
            marginTop: 16,
            fontSize: 14,
            fontWeight: 500,
            color: colors.cyan,
            fontFamily: fonts.kicker,
            letterSpacing: "0.08em",
            opacity: interpolate(ctaIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(ctaIn, [0, 1], [15, 0]) + arrowBounce}px)`,
          }}
        >
          ↓ Drop a comment below
        </div>
      </div>
    </AbsoluteFill>
  );
};
