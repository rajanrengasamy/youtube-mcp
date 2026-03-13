import React from "react";
import { fonts, colors } from "../lib/theme";

interface TerminalProps {
  title?: string;
  children: React.ReactNode;
  width?: number;
  tint?: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  title = "zsh — 80×24",
  children,
  width = 860,
  tint,
}) => {
  return (
    <div
      style={{
        width,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#0d1117",
        border: `1px solid ${colors.border}`,
        boxShadow:
          "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.05)",
        position: "relative",
      }}
    >
      {tint && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: tint,
            pointerEvents: "none",
            borderRadius: 10,
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 16px",
          backgroundColor: colors.surface2,
          borderBottom: `1px solid ${colors.border}`,
          position: "relative",
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
            fontSize: 11,
            color: "#6b7280",
            fontFamily: fonts.mono,
          }}
        >
          {title}
        </div>
        <div style={{ width: 48 }} />
      </div>
      <div
        style={{
          padding: "20px 24px",
          fontSize: 14,
          lineHeight: 1.6,
          fontFamily: fonts.mono,
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
};
