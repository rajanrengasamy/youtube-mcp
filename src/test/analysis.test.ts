import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeComments,
  buildTranscriptSegmentsForWindow,
  parseDescriptionChapters,
  scoreHookPattern,
  titleStructure,
} from "../lib/analysis.js";
import type { TranscriptRecord } from "../lib/types.js";

test("parseDescriptionChapters extracts chapter markers", () => {
  const chapters = parseDescriptionChapters("0:00 Intro\n1:15 Problem\n10:05 Solution");
  assert.equal(chapters.length, 3);
  assert.equal(chapters[1]?.title, "Problem");
  assert.equal(chapters[1]?.tStartSec, 75);
});

test("buildTranscriptSegmentsForWindow groups transcript segments into topic windows", () => {
  const transcript: TranscriptRecord = {
    videoId: "dQw4w9WgXcQ",
    languageUsed: "en",
    sourceType: "manual_caption",
    transcriptText: "A B C D",
    segments: [
      { tStartSec: 0, tEndSec: 20, text: "Intro and problem framing." },
      { tStartSec: 30, tEndSec: 55, text: "The promise and proof section." },
      { tStartSec: 140, tEndSec: 180, text: "Second chapter with examples." },
    ],
  };

  const windows = buildTranscriptSegmentsForWindow(transcript, 120, 4);
  assert.equal(windows.length, 2);
  assert.equal(windows[0]?.tStartSec, 0);
  assert.equal(windows[1]?.tStartSec, 140);
});

test("scoreHookPattern detects promise-style openings", () => {
  const transcript: TranscriptRecord = {
    videoId: "dQw4w9WgXcQ",
    languageUsed: "en",
    sourceType: "manual_caption",
    transcriptText: "",
    segments: [
      { tStartSec: 0, tEndSec: 10, text: "Today I'll show you how to write better YouTube titles in 10 minutes." },
      { tStartSec: 10, tEndSec: 20, text: "By the end you'll have a reusable checklist and real examples." },
    ],
  };

  const hook = scoreHookPattern("dQw4w9WgXcQ", transcript, 30);
  assert.equal(hook.hookType, "promise");
  assert.equal(hook.hookScore >= 60, true);
});

test("analyzeComments returns sentiment and themes", () => {
  const analysis = analyzeComments(
    [
      { author: "A", text: "Great explanation and very helpful." },
      { author: "B", text: "Helpful examples. Love this." },
      { author: "C", text: "A bit confusing in the middle." },
    ],
    true,
    true,
  );

  assert.equal(analysis.sentiment.positivePct > analysis.sentiment.negativePct, true);
  assert.equal((analysis.themes?.length ?? 0) > 0, true);
  assert.equal((analysis.representativeQuotes?.length ?? 0) > 0, true);
});

test("titleStructure classifies common title patterns", () => {
  assert.equal(titleStructure("How to Write Better Hooks: 5 Patterns"), "number+colon+how_why_what");
});
