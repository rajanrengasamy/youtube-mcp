import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { MediaStore } from "../lib/media-store.js";
import { MediaDownloader } from "../lib/media-downloader.js";
import { ThumbnailExtractor } from "../lib/thumbnail-extractor.js";
import { VisualIndexStore, VisualSearchEngine } from "../lib/visual-search.js";

function createFixtureFile(dir: string, name: string): string {
  const filePath = join(dir, name);
  writeFileSync(filePath, "fixture");
  return filePath;
}

test("visual search ranks OCR and description-backed matches with image evidence", async () => {
  const root = mkdtempSync(join(tmpdir(), "vidlens-visual-test-"));
  const framesDir = join(root, "frames");
  mkdirSync(framesDir, { recursive: true });

  const mediaStore = new MediaStore({ dataDir: root });
  const visualStore = new VisualIndexStore({ dataDir: root });
  const engine = new VisualSearchEngine(
    mediaStore,
    new MediaDownloader(mediaStore),
    new ThumbnailExtractor(mediaStore),
    { dataDir: root, store: visualStore },
  );

  const firstFrame = createFixtureFile(framesDir, "frame-1.jpg");
  const secondFrame = createFixtureFile(framesDir, "frame-2.jpg");

  visualStore.upsertFrame({
    videoId: "video1234567",
    frameAssetId: "asset-1",
    framePath: firstFrame,
    timestampSec: 12,
    sourceVideoUrl: "https://www.youtube.com/watch?v=video1234567",
    sourceVideoTitle: "Architecture walkthrough",
    ocrText: "SYSTEM ARCHITECTURE OVERVIEW",
    visualDescription: "A whiteboard architecture diagram with service boxes and arrows.",
    featureVector: [1, 0, 0],
    descriptionModel: "gemini-2.5-flash",
  });

  visualStore.upsertFrame({
    videoId: "video1234567",
    frameAssetId: "asset-2",
    framePath: secondFrame,
    timestampSec: 48,
    sourceVideoUrl: "https://www.youtube.com/watch?v=video1234567",
    sourceVideoTitle: "Architecture walkthrough",
    ocrText: "ENGAGEMENT DASHBOARD",
    visualDescription: "A metrics dashboard showing retention and comments charts.",
    featureVector: [0.8, 0.2, 0],
    descriptionModel: "gemini-2.5-flash",
  });

  const search = await engine.searchText({ query: "architecture diagram", videoId: "video1234567", autoIndexIfNeeded: false });
  assert.equal(search.results.length > 0, true);
  assert.equal(search.results[0]?.frameAssetId, "asset-1");
  assert.equal(search.results[0]?.framePath, firstFrame);
  assert.equal(search.results[0]?.matchedOn.includes("description"), true);

  const similar = await engine.findSimilarFrames({ assetId: "asset-1", videoId: "video1234567", minSimilarity: 0.1 });
  assert.equal(similar.results.length, 1);
  assert.equal(similar.results[0]?.frameAssetId, "asset-2");
  assert.equal(similar.results[0]?.framePath, secondFrame);
});
