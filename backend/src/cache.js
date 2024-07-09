import fs from "fs";
import path from "path";
import crypto from "crypto";
import { CACHE_DIR } from "./config.js";
import { asyncErrorHandler } from "./errorHandler.js";

/// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

function getCacheKey(repo, filePath) {
  return crypto.createHash("md5").update(`${repo}:${filePath}`).digest("hex");
}

async function getCachedContent(repo, filePath) {
  const cacheKey = getCacheKey(repo, filePath);
  const cacheFile = path.join(CACHE_DIR, cacheKey);

  if (fs.existsSync(cacheFile)) {
    const { content, etag, timestamp } = JSON.parse(
      await fs.promises.readFile(cacheFile, "utf8")
    );
    // Check if cache is not older than 1 day
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      return { content, etag };
    }
  }

  return null;
}

async function setCachedContent(repo, filePath, content, etag) {
  const cacheKey = getCacheKey(repo, filePath);
  const cacheFile = path.join(CACHE_DIR, cacheKey);
  const cacheContent = JSON.stringify({ content, etag, timestamp: Date.now() });
  await fs.promises.writeFile(cacheFile, cacheContent, "utf8");
}

export const asyncGetCachedContent = asyncErrorHandler(getCachedContent);
export const asyncSetCachedContent = asyncErrorHandler(setCachedContent);

export {
  getCachedContent, // for test only
  setCachedContent, // for test only
};
