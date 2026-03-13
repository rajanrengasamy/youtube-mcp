import React from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { colors, fonts, springs } from "../lib/theme";
import { Terminal } from "../components/Terminal";

// Helper: reveal text character-by-character
const useTypewriter = (
  text: string,
  frame: number,
  startFrame: number,
  charsPerFrame = 4,
) => {
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  return { text: text.slice(0, chars), done: chars >= text.length };
};

// --- Pain 1: API Key Pain (0-120 frames, 4s) ---
const PainApiKey: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const terminalIn = spring({
    frame,
    fps,
    delay: 5,
    config: springs.entrance,
  });

  const cmd = useTypewriter("npx tube-mcp", frame, 15, 3);
  const showError = frame > 50;
  const errorShake =
    showError && frame < 62
      ? Math.sin((frame - 50) * 3) * 4
      : 0;
  const errorOpacity = spring({
    frame,
    fps,
    delay: 50,
    config: springs.entrance,
  });
  const labelIn = spring({ frame, fps, delay: 75, config: springs.gentle });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.04), transparent 70%)",
        }}
      />
      <div
        style={{
          opacity: interpolate(terminalIn, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(terminalIn, [0, 1], [20, 0])}px) translateX(${errorShake}px)`,
        }}
      >
        <Terminal title="zsh — 80×24" width={860} tint="rgba(239,68,68,0.04)">
          <div style={{ color: colors.muted, fontSize: 14 }}>
            <div>
              <span style={{ color: colors.cyan }}>❯ </span>
              <span style={{ color: colors.white }}>{cmd.text}</span>
              {!cmd.done && (
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
            {showError && (
              <>
                <div style={{ height: 8 }} />
                <div
                  style={{
                    color: colors.red,
                    opacity: interpolate(errorOpacity, [0, 1], [0, 1]),
                  }}
                >
                  Error: YOUTUBE_API_KEY is not set
                </div>
                <div
                  style={{
                    color: colors.muted,
                    opacity: interpolate(errorOpacity, [0, 1], [0, 1]),
                    marginTop: 2,
                    fontSize: 13,
                  }}
                >
                  {"    "}Set YOUTUBE_API_KEY={"<your_key>"} in your environment
                </div>
                <div
                  style={{
                    color: colors.muted,
                    opacity: interpolate(errorOpacity, [0, 1], [0, 1]),
                    fontSize: 13,
                  }}
                >
                  {"    "}Documentation:
                  https://console.cloud.google.com/apis
                </div>
              </>
            )}
          </div>
        </Terminal>
      </div>
      <div
        style={{
          marginTop: 32,
          fontSize: 28,
          fontWeight: 500,
          color: colors.muted,
          fontFamily: fonts.body,
          textAlign: "center",
          opacity: interpolate(labelIn, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(labelIn, [0, 1], [15, 0])}px)`,
        }}
      >
        They all need an{" "}
        <span style={{ color: colors.red }}>API key</span> to do anything
        useful.
      </div>
    </AbsoluteFill>
  );
};

// --- Pain 2: Crash Error (120-220 frames, ~3.3s) ---
const PainBreaking: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const terminalIn = spring({
    frame,
    fps,
    delay: 5,
    config: springs.entrance,
  });
  const errorShake =
    frame > 30 && frame < 42 ? Math.sin((frame - 30) * 3) * 6 : 0;
  const errorIn = spring({ frame, fps, delay: 30, config: springs.entrance });
  const labelIn = spring({ frame, fps, delay: 55, config: springs.gentle });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.04), transparent 70%)",
        }}
      />
      <div
        style={{
          opacity: interpolate(terminalIn, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(terminalIn, [0, 1], [20, 0])}px) translateX(${errorShake}px)`,
        }}
      >
        <Terminal title="zsh — 80×24" width={860} tint="rgba(239,68,68,0.04)">
          <div style={{ color: colors.muted, fontSize: 14 }}>
            <div>
              <span style={{ color: colors.cyan }}>❯ </span>
              <span style={{ color: colors.white }}>
                tube-mcp search &apos;CS229 Stanford full lecture&apos;
              </span>
            </div>
            <div style={{ height: 8 }} />
            <div
              style={{
                color: colors.red,
                opacity: interpolate(errorIn, [0, 1], [0, 1]),
              }}
            >
              Error: result exceeds maximum length of 1048576
            </div>
            <div
              style={{
                color: colors.muted,
                opacity: interpolate(errorIn, [0, 1], [0, 1]),
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {"    "}at validateResponseSize (utils.js:142:11)
            </div>
            <div
              style={{
                color: colors.muted,
                opacity: interpolate(errorIn, [0, 1], [0, 1]),
                fontSize: 12,
              }}
            >
              {"    "}at processTranscript (transcript.js:89:5)
            </div>
          </div>
        </Terminal>
      </div>
      <div
        style={{
          marginTop: 32,
          fontSize: 28,
          fontWeight: 500,
          color: colors.muted,
          fontFamily: fonts.body,
          textAlign: "center",
          opacity: interpolate(labelIn, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(labelIn, [0, 1], [15, 0])}px)`,
        }}
      >
        Long videos <span style={{ color: colors.red }}>crash</span>. Lectures?
        Forget it.
      </div>
    </AbsoluteFill>
  );
};

// --- Pain 3: Token Waste (220-330 frames, ~3.7s) ---
const PainTokenWaste: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftIn = spring({ frame, fps, delay: 5, config: springs.entrance });
  const rightIn = spring({ frame, fps, delay: 18, config: springs.entrance });
  const arrowIn = spring({ frame, fps, delay: 70, config: springs.gentle });
  const labelIn = spring({ frame, fps, delay: 80, config: springs.gentle });

  const bloatedLines = [
    '  "kind": "youtube#videoListResponse",',
    '  "etag": "dGzPR0T2aKQ...",',
    '  "pageInfo": { "totalResults": 1 },',
    '  "items": [{',
    '    "id": "dQw4w9WgXcQ",',
    '    "snippet": {',
    '      "publishedAt": "2024-01-15T..',
    '      "channelId": "UC..."',
  ];
  const bloatedJson = "{\n" + bloatedLines.join("\n") + "\n}";

  const compactLines = [
    '  title: "CS229 Lecture 4",',
    '  duration: "1:23:45",',
    "  transcript: [",
    '    { t: "0:00", text: "Today..." },',
    '    { t: "5:30", text: "So the..." }',
    "  ]",
  ];
  const compactOutput = "{\n" + compactLines.join("\n") + "\n}";

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(99,110,180,0.04), transparent 70%)",
        }}
      />
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        {/* Left: bloated */}
        <div
          style={{
            width: 420,
            opacity: interpolate(leftIn, [0, 1], [0, 1]),
            transform: `translateX(${interpolate(leftIn, [0, 1], [-30, 0])}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: colors.red,
                fontFamily: fonts.kicker,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Raw API dump
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: fonts.kicker,
                color: colors.red,
                backgroundColor: "rgba(239,68,68,0.1)",
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              ~4,200 tokens
            </div>
          </div>
          <div
            style={{
              backgroundColor: "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10,
              padding: 18,
              fontFamily: fonts.mono,
              fontSize: 12,
              color: colors.muted,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              height: 240,
              overflow: "hidden",
            }}
          >
            {bloatedJson}
          </div>
        </div>

        {/* Arrow + label */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 240,
            marginTop: 30,
            opacity: interpolate(arrowIn, [0, 1], [0, 1]),
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: colors.cyan,
            }}
          >
            →
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: fonts.kicker,
              color: colors.green,
              marginTop: 6,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              whiteSpace: "nowrap",
            }}
          >
            96% less
          </div>
        </div>

        {/* Right: compact */}
        <div
          style={{
            width: 380,
            opacity: interpolate(rightIn, [0, 1], [0, 1]),
            transform: `translateX(${interpolate(rightIn, [0, 1], [30, 0])}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: colors.green,
                fontFamily: fonts.kicker,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              tube-mcp
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: fonts.kicker,
                color: colors.green,
                backgroundColor: "rgba(34,197,94,0.1)",
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              ~180 tokens
            </div>
          </div>
          <div
            style={{
              backgroundColor: "rgba(34,197,94,0.04)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 10,
              padding: 18,
              fontFamily: fonts.mono,
              fontSize: 12,
              color: colors.white,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              height: 240,
              overflow: "hidden",
            }}
          >
            {compactOutput}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 32,
          fontSize: 28,
          fontWeight: 500,
          color: colors.muted,
          fontFamily: fonts.body,
          textAlign: "center",
          opacity: interpolate(labelIn, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(labelIn, [0, 1], [15, 0])}px)`,
        }}
      >
        Raw API dumps{" "}
        <span style={{ color: colors.red }}>waste your entire</span> context
        window.
      </div>
    </AbsoluteFill>
  );
};

export const PainPointsScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={120} premountFor={30}>
        <PainApiKey />
      </Sequence>
      <Sequence from={120} durationInFrames={100} premountFor={30}>
        <PainBreaking />
      </Sequence>
      <Sequence from={220} durationInFrames={110} premountFor={30}>
        <PainTokenWaste />
      </Sequence>
    </AbsoluteFill>
  );
};
