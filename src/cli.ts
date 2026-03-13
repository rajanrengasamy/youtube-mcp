#!/usr/bin/env node
import { startStdioServer } from "./server/mcp-server.js";

startStdioServer().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`youtube-mcp failed to start: ${message}\n`);
  process.exitCode = 1;
});
