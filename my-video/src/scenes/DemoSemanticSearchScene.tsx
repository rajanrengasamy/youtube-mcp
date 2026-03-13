import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { colors, fonts, springs } from "../lib/theme";

// Claude Desktop-inspired colors
const claude = {
  bg: "#f5f0ea",
  text: "#2d2418",
  textLight: "#8b7e6e",
  cardBg: "#ece6dd",
  border: "#ddd5ca",
  accent: "#c97c5d",
  white: "#ffffff",
};

const searchResults = [
  {
    title: "CS229: Machine Learning — Lecture 4 (Gradient Descent)",
    channel: "Stanford Online",
    timestamp: "1:23:14",
    match: "...the cost function J(θ) decreases with each step of gradient descent, converging toward the global minimum...",
    score: "98%",
  },
  {
    title: "CS231n: Deep Learning for Vision — Lecture 3",
    channel: "Stanford Online",
    timestamp: "45:02",
    match: "...stochastic gradient descent introduces randomness through mini-batches, which helps escape local minima...",
    score: "94%",
  },
  {
    title: "CS224N: NLP with Deep Learning — Lecture 6",
    channel: "Stanford Online",
    timestamp: "2:01:38",
    match: "...we apply gradient descent to optimize our word embedding parameters across the entire vocabulary...",
    score: "91%",
  },
];

export const DemoSemanticSearchScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowIn = spring({
    frame,
    fps,
    delay: 3,
    config: springs.entrance,
  });

  // User message typing
  const userMsg = "Search my Stanford CS lectures for gradient descent";
  const typeProgress = Math.min(
    userMsg.length,
    Math.max(0, Math.floor((frame - 15) / 1.5)),
  );
  const typedUserMsg = userMsg.slice(0, typeProgress);
  const userMsgDone = typeProgress >= userMsg.length;

  // Tool call indicator
  const toolIn = spring({
    frame,
    fps,
    delay: userMsgDone ? 60 : 999,
    config: springs.entrance,
  });

  // Response text
  const responseIn = spring({
    frame,
    fps,
    delay: userMsgDone ? 78 : 999,
    config: springs.gentle,
  });

  // Footer stat
  const footerIn = spring({
    frame,
    fps,
    delay: userMsgDone ? 130 : 999,
    config: springs.gentle,
  });

  // Bottom label
  const labelIn = spring({ frame, fps, delay: 150, config: springs.gentle });

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
        {/* Claude Desktop Window */}
        <div
          style={{
            width: 900,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            opacity: interpolate(windowIn, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(windowIn, [0, 1], [20, 0])}px) scale(${interpolate(windowIn, [0, 1], [0.97, 1])})`,
          }}
        >
          {/* Title bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              backgroundColor: "#ece6dd",
              borderBottom: `1px solid ${claude.border}`,
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#ff5f56",
                }}
              />
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#ffbd2e",
                }}
              />
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#27c93f",
                }}
              />
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 13,
                fontWeight: 500,
                color: claude.textLight,
                fontFamily: fonts.body,
              }}
            >
              Claude
            </div>
            <div style={{ width: 48 }} />
          </div>

          {/* Chat area */}
          <div
            style={{
              backgroundColor: claude.bg,
              padding: "20px 44px 12px",
            }}
          >
            {/* User message */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: claude.textLight,
                  fontFamily: fonts.body,
                  marginBottom: 4,
                }}
              >
                You
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: claude.text,
                  fontFamily: fonts.body,
                  lineHeight: 1.5,
                }}
              >
                {typedUserMsg}
                {!userMsgDone && (
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
                      color: claude.accent,
                    }}
                  >
                    |
                  </span>
                )}
              </div>
            </div>

            {/* Claude response */}
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: claude.textLight,
                  fontFamily: fonts.body,
                  marginBottom: 6,
                  opacity: interpolate(toolIn, [0, 1], [0, 1]),
                }}
              >
                Claude
              </div>

              {/* Tool use indicator */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: claude.cardBg,
                  borderRadius: 8,
                  padding: "6px 12px",
                  marginBottom: 12,
                  opacity: interpolate(toolIn, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(toolIn, [0, 1], [8, 0])}px)`,
                }}
              >
                <span style={{ fontSize: 13 }}>&#9881;</span>
                <span
                  style={{
                    fontSize: 12,
                    color: claude.textLight,
                    fontFamily: fonts.mono,
                  }}
                >
                  tube-mcp: search_transcripts
                </span>
              </div>

              {/* Response text */}
              <div
                style={{
                  fontSize: 15,
                  color: claude.text,
                  fontFamily: fonts.body,
                  lineHeight: 1.5,
                  marginBottom: 10,
                  opacity: interpolate(responseIn, [0, 1], [0, 1]),
                }}
              >
                Found 3 relevant segments across your lectures:
              </div>

              {/* Results */}
              {searchResults.map((result, i) => {
                const resultIn = spring({
                  frame,
                  fps,
                  delay: userMsgDone ? 88 + i * 12 : 999,
                  config: springs.entrance,
                });

                return (
                  <div
                    key={result.timestamp}
                    style={{
                      backgroundColor: claude.cardBg,
                      borderRadius: 8,
                      padding: "10px 14px",
                      marginBottom: 6,
                      opacity: interpolate(resultIn, [0, 1], [0, 1]),
                      transform: `translateY(${interpolate(resultIn, [0, 1], [10, 0])}px)`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: claude.text,
                          fontFamily: fonts.body,
                        }}
                      >
                        {result.title}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: "#27c93f",
                            fontFamily: fonts.kicker,
                          }}
                        >
                          {result.score}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: claude.accent,
                            fontFamily: fonts.mono,
                          }}
                        >
                          {result.timestamp}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: claude.textLight,
                        fontFamily: fonts.body,
                        marginTop: 3,
                        fontStyle: "italic",
                      }}
                    >
                      &ldquo;{result.match}&rdquo;
                    </div>
                  </div>
                );
              })}

              {/* Footer stat */}
              <div
                style={{
                  fontSize: 11,
                  color: claude.textLight,
                  fontFamily: fonts.kicker,
                  textAlign: "center",
                  marginTop: 8,
                  opacity: interpolate(footerIn, [0, 1], [0, 1]),
                }}
              >
                3 results across 847 transcripts · 340ms
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div
            style={{
              backgroundColor: claude.bg,
              padding: "8px 44px 14px",
              borderTop: `1px solid ${claude.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: claude.white,
                borderRadius: 20,
                padding: "8px 14px",
                border: `1px solid ${claude.border}`,
              }}
            >
              <div
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "#b0a594",
                  fontFamily: fonts.body,
                }}
              >
                How can I help you today?
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: claude.textLight,
                    fontFamily: fonts.body,
                  }}
                >
                  Sonnet 4.6
                </span>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    backgroundColor: claude.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: "#fff", fontSize: 14 }}>&#8593;</span>
                </div>
              </div>
            </div>
          </div>
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
          Search across entire playlists like you search{" "}
          <span style={{ color: colors.cyan }}>your notes</span>.
        </div>
      </div>
    </AbsoluteFill>
  );
};
