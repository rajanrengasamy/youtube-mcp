import assert from "node:assert/strict";
import test from "node:test";
import { parseChannelRef, parsePlaylistId, parseVideoId } from "../lib/id-parsing.js";

test("parseVideoId handles ids and URLs", () => {
  assert.equal(parseVideoId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(parseVideoId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(parseVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42"), "dQw4w9WgXcQ");
  assert.equal(parseVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(parseVideoId("not-a-video-id"), null);
});

test("parsePlaylistId handles raw IDs and URLs", () => {
  assert.equal(parsePlaylistId("PL590L5WQmH8fJ54FNRU3kVZKeTxQqM2C4"), "PL590L5WQmH8fJ54FNRU3kVZKeTxQqM2C4");
  assert.equal(
    parsePlaylistId("https://www.youtube.com/playlist?list=PL590L5WQmH8fJ54FNRU3kVZKeTxQqM2C4"),
    "PL590L5WQmH8fJ54FNRU3kVZKeTxQqM2C4",
  );
});

test("parseChannelRef handles id, handle, custom, and URL", () => {
  assert.deepEqual(parseChannelRef("UC_x5XG1OV2P6uZZ5FSM9Ttw"), {
    type: "id",
    value: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
  });
  assert.deepEqual(parseChannelRef("@GoogleDevelopers"), {
    type: "handle",
    value: "GoogleDevelopers",
  });
  assert.deepEqual(parseChannelRef("https://www.youtube.com/@GoogleDevelopers"), {
    type: "handle",
    value: "GoogleDevelopers",
  });
  assert.deepEqual(parseChannelRef("GoogleDevelopers"), {
    type: "custom",
    value: "GoogleDevelopers",
  });
});
