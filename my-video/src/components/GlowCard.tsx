import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { colors, springs } from "../lib/theme";

interface GlowCardProps {
  children: React.ReactNode;
  delay?: number;
  width?: number;
  accentColor?: string;
  springConfig?: Record<string, number>;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  delay = 0,
  width = 260,
  accentColor = colors.cyan,
  springConfig = springs.entrance,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, delay, config: springConfig });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [50, 0]);

  return (
    <div
      style={{
        width,
        borderRadius: 16,
        padding: "32px 24px",
        backgroundColor: "rgba(15,17,26,0.8)",
        backdropFilter: "blur(16px)",
        border: `1px solid rgba(99,110,180,0.2)`,
        boxShadow: `0 0 0 1px ${accentColor}14, 0 8px 32px rgba(0,0,0,0.4)`,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {children}
    </div>
  );
};
