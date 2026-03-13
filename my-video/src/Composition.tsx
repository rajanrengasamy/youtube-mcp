import { AbsoluteFill, Series } from "remotion";
import { HookScene } from "./scenes/HookScene";
import { PainPointsScene } from "./scenes/PainPointsScene";
import { SolutionRevealScene } from "./scenes/SolutionRevealScene";
import { PillarsScene } from "./scenes/PillarsScene";
import { DemoZeroConfigScene } from "./scenes/DemoZeroConfigScene";
import { DemoSemanticSearchScene } from "./scenes/DemoSemanticSearchScene";
import { FallbackChainScene } from "./scenes/FallbackChainScene";
import { PositioningScene } from "./scenes/PositioningScene";
import { CTAScene } from "./scenes/CTAScene";

export const MyComposition = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#08090d" }}>
      <Series>
        {/* Act 1: THE PROBLEM (0-15s) */}
        <Series.Sequence durationInFrames={120}>
          <HookScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={330}>
          <PainPointsScene />
        </Series.Sequence>

        {/* Act 2: THE SOLUTION (15-27s) */}
        <Series.Sequence durationInFrames={150}>
          <SolutionRevealScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <PillarsScene />
        </Series.Sequence>

        {/* Act 3: THE DEMO (27-48s) */}
        <Series.Sequence durationInFrames={210}>
          <DemoZeroConfigScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <DemoSemanticSearchScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <FallbackChainScene />
        </Series.Sequence>

        {/* Act 4: CTA (48-60s) */}
        <Series.Sequence durationInFrames={150}>
          <PositioningScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <CTAScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
