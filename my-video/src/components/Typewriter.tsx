import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { fonts, colors } from "../lib/theme";

interface TypewriterProps {
  text: string;
  startFrame?: number;
  charFrames?: number;
  fontSize?: number;
  color?: string;
  prompt?: string;
  showCursor?: boolean;
}

const Cursor: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame % 16, [0, 8, 16], [1, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <span style={{ opacity, color: colors.white }}>█</span>;
};

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  startFrame = 0,
  charFrames = 2,
  fontSize = 14,
  color = colors.white,
  prompt = "❯ ",
  showCursor = true,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - startFrame);
  const typedChars = Math.min(
    text.length,
    Math.floor(adjustedFrame / charFrames),
  );
  const typedText = text.slice(0, typedChars);

  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}
    >
      {prompt && <span style={{ color: colors.cyan }}>{prompt}</span>}
      <span style={{ color }}>{typedText}</span>
      {showCursor && <Cursor frame={frame} />}
    </div>
  );
};
