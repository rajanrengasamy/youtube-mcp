import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { colors, fonts, springs } from "../lib/theme";
import { Terminal } from "../components/Terminal";

interface TermLine {
  text: string;
  color: string;
  frame: number;
  indent?: boolean;
  highlight?: boolean;
}

const lines: TermLine[] = [
  { text: "❯ npx tube-mcp", color: colors.white, frame: 10 },
  {
    text: "  Need to install the following packages:",
    color: colors.muted,
    frame: 35,
  },
  { text: "  tube-mcp@1.0.0", color: colors.cyan, frame: 45 },
  { text: "  Ok to proceed? (y)", color: colors.muted, frame: 55 },
  { text: "  ✓ Downloading tube-mcp...", color: colors.green, frame: 80 },
  { text: "  ✓ Installed successfully", color: colors.green, frame: 100 },
  { text: "", color: colors.muted, frame: 115 },
  { text: "  🎬 tube-mcp v1.0.0 starting...", color: colors.white, frame: 120 },
  { text: "  ✓ MCP server ready on stdio", color: colors.green, frame: 135 },
  {
    text: "  ✓ No API key required — using public endpoints",
    color: colors.green,
    frame: 145,
    highlight: true,
  },
  { text: "  ✓ Semantic index: ready", color: colors.green, frame: 155 },
  {
    text: "  ✓ Fallback chain: API → yt-dlp → scrape",
    color: colors.green,
    frame: 165,
  },
  {
    text: "  Listening for MCP tool calls...",
    color: colors.muted,
    frame: 178,
  },
];

export const DemoZeroConfigScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const terminalIn = spring({
    frame,
    fps,
    delay: 3,
    config: springs.entrance,
  });
  const labelIn = spring({ frame, fps, delay: 185, config: springs.gentle });

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
          gap: 24,
        }}
      >
        {/* Section label */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: colors.cyan,
            fontFamily: fonts.kicker,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            opacity: interpolate(terminalIn, [0, 1], [0, 1]),
          }}
        >
          Zero Config Demo
        </div>

        <div
          style={{
            opacity: interpolate(terminalIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(terminalIn, [0, 1], [20, 0])}px)`,
          }}
        >
          <Terminal title="tube-mcp — setup" width={860}>
            <div style={{ fontSize: 14, lineHeight: 1.8 }}>
              {lines.map((line, i) => {
                if (frame < line.frame) return null;
                const lineOpacity = interpolate(
                  frame,
                  [line.frame, line.frame + 6],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                );

                // First line uses typewriter
                if (i === 0) {
                  const cmdText = "npx tube-mcp";
                  const elapsed = Math.max(0, frame - line.frame);
                  const chars = Math.min(
                    cmdText.length,
                    Math.floor(elapsed * 3),
                  );
                  const typed = cmdText.slice(0, chars);
                  return (
                    <div key={i}>
                      <span style={{ color: colors.cyan }}>❯ </span>
                      <span style={{ color: colors.white }}>{typed}</span>
                      {chars < cmdText.length && (
                        <span
                          style={{
                            opacity: interpolate(
                              frame % 16,
                              [0, 8, 16],
                              [1, 0, 1],
                              {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                              },
                            ),
                            color: colors.white,
                          }}
                        >
                          █
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    style={{
                      color: line.color,
                      opacity: lineOpacity,
                      backgroundColor: line.highlight
                        ? "rgba(34,197,94,0.06)"
                        : "transparent",
                      borderLeft: line.highlight
                        ? `2px solid ${colors.green}`
                        : "2px solid transparent",
                      paddingLeft: line.highlight ? 8 : 0,
                      marginLeft: line.highlight ? -10 : 0,
                      borderRadius: line.highlight ? 2 : 0,
                    }}
                  >
                    {line.text}
                  </div>
                );
              })}
              {/* Blinking cursor at end */}
              {frame > 178 && (
                <span
                  style={{
                    opacity: interpolate(
                      frame % 16,
                      [0, 8, 16],
                      [1, 0, 1],
                      {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      },
                    ),
                    color: colors.white,
                  }}
                >
                  █
                </span>
              )}
            </div>
          </Terminal>
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: colors.muted,
            fontFamily: fonts.body,
            textAlign: "center",
            opacity: interpolate(labelIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(labelIn, [0, 1], [15, 0])}px)`,
          }}
        >
          Works immediately.{" "}
          <span style={{ color: colors.green }}>No API key.</span> No setup.
        </div>
      </div>
    </AbsoluteFill>
  );
};
