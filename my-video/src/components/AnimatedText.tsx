import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { fonts, colors, springs } from "../lib/theme";

interface AnimatedTextProps {
  text: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: React.CSSProperties["fontWeight"];
  color?: string;
  fontFamily?: string;
  style?: React.CSSProperties;
  springConfig?: Record<string, number>;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  fontSize = 48,
  fontWeight = 700,
  color = colors.white,
  fontFamily = fonts.display,
  style,
  springConfig = springs.entrance,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame, fps, delay, config: springConfig });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div
      style={{
        fontSize,
        fontWeight,
        color,
        fontFamily,
        opacity,
        transform: `translateY(${translateY}px)`,
        letterSpacing: "-0.025em",
        ...style,
      }}
    >
      {text}
    </div>
  );
};
