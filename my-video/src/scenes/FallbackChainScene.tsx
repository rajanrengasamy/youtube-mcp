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

const nodes = [
  { label: "YouTube API", sublabel: "Primary", color: colors.cyan },
  { label: "yt-dlp", sublabel: "Fallback 1", color: colors.purple },
  { label: "Page Extract", sublabel: "Fallback 2", color: colors.green },
];

export const FallbackChainScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Node entrances (staggered)
  const nodesIn = nodes.map((_, i) =>
    spring({ frame, fps, delay: 10 + i * 12, config: springs.entrance }),
  );

  // Arrow draws (scaleX from 0→1)
  const arrow1Draw = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const arrow2Draw = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Node 1 failure
  const failIn = spring({ frame, fps, delay: 80, config: springs.slam });
  const failAmount = interpolate(failIn, [0, 1], [0, 1]);

  // Node 2 catch
  const catchIn = spring({
    frame,
    fps,
    delay: 100,
    config: springs.entrance,
  });
  const catchAmount = interpolate(catchIn, [0, 1], [0, 1]);

  // Status label
  const statusIn = spring({ frame, fps, delay: 110, config: springs.gentle });

  // Bottom label
  const labelIn = spring({ frame, fps, delay: 140, config: springs.gentle });

  const nodeW = 160;

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
          gap: 36,
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
            opacity: interpolate(nodesIn[0], [0, 1], [0, 1]),
          }}
        >
          Three-Tier Fallback
        </div>

        {/* Nodes row */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {nodes.map((node, i) => {
            const isFirst = i === 0;
            const isSecond = i === 1;

            // Dynamic styling based on fail/catch state
            let borderColor = `${node.color}40`;
            let bgColor = `${node.color}0a`;
            let textColor = node.color;
            let statusIcon = "";

            if (isFirst && failAmount > 0.5) {
              borderColor = colors.red;
              bgColor = "rgba(239,68,68,0.08)";
              textColor = colors.red;
              statusIcon = "✗";
            }
            if (isSecond && catchAmount > 0.5) {
              borderColor = colors.green;
              bgColor = "rgba(34,197,94,0.08)";
              textColor = colors.green;
              statusIcon = "✓";
            }

            return (
              <React.Fragment key={node.label}>
                <div
                  style={{
                    width: nodeW,
                    padding: "20px 16px",
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    backgroundColor: bgColor,
                    textAlign: "center",
                    opacity: interpolate(nodesIn[i], [0, 1], [0, 1]),
                    transform: `translateY(${interpolate(nodesIn[i], [0, 1], [30, 0])}px)`,
                  }}
                >
                  {statusIcon && (
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: textColor,
                        marginBottom: 4,
                      }}
                    >
                      {statusIcon}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: textColor,
                      fontFamily: fonts.mono,
                    }}
                  >
                    {node.label}
                  </div>
                  {isFirst && failAmount > 0.5 && (
                    <div
                      style={{
                        fontSize: 10,
                        color: colors.red,
                        fontFamily: fonts.kicker,
                        marginTop: 4,
                      }}
                    >
                      (Rate Limited)
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 10,
                      color: colors.muted,
                      fontFamily: fonts.kicker,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginTop: 6,
                    }}
                  >
                    {node.sublabel}
                  </div>
                </div>

                {/* Arrow */}
                {i < nodes.length - 1 && (
                  <div
                    style={{
                      width: 60,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 2,
                        backgroundColor:
                          i === 0 && failAmount > 0.5
                            ? `${colors.red}50`
                            : i === 1 && catchAmount > 0.5
                              ? colors.green
                              : node.color,
                        transformOrigin: "left",
                        transform: `scaleX(${i === 0 ? arrow1Draw : arrow2Draw})`,
                        borderRadius: 1,
                      }}
                    />
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderTop: "5px solid transparent",
                        borderBottom: "5px solid transparent",
                        borderLeft: `8px solid ${
                          i === 0 && failAmount > 0.5
                            ? `${colors.red}50`
                            : i === 1 && catchAmount > 0.5
                              ? colors.green
                              : node.color
                        }`,
                        opacity: i === 0 ? arrow1Draw : arrow2Draw,
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Status label */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: colors.green,
            fontFamily: fonts.body,
            opacity: interpolate(statusIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(statusIn, [0, 1], [10, 0])}px)`,
          }}
        >
          Fallback activated · Transcript delivered
        </div>

        {/* Bottom label */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: colors.muted,
            fontFamily: fonts.body,
            textAlign: "center",
            opacity: interpolate(labelIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(labelIn, [0, 1], [15, 0])}px)`,
          }}
        >
          Three-tier fallback.{" "}
          <span style={{ color: colors.green }}>Your transcripts, always.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
