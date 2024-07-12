import fs from "fs";
import path from "path";
import crypto from "crypto";
import { CACHE_DIR } from "./config.js";
import { handleFileSystemError, handleParsingError } from "./errorHandler.js";

function getCacheKey(repo, filePath) {
  return crypto.createHash("md5").update(`${repo}:${filePath}`).digest("hex");
}

export function createCache(logger) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  async function getCachedContent(repo, filePath) {
    const cacheKey = getCacheKey(repo, filePath);
    const cacheFile = path.join(CACHE_DIR, cacheKey);

    try {
      if (fs.existsSync(cacheFile)) {
        const rawData = await fs.promises.readFile(cacheFile, "utf8");
        try {
          const { content, etag, timestamp } = JSON.parse(rawData);
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            return { content, etag };
          }
        } catch (parseError) {
          handleParsingError(parseError, logger, "cache data", cacheFile);
        }
      }
    } catch (error) {
      handleFileSystemError(error, logger, "read", cacheFile);
    }

    return null;
  }

  async function setCachedContent(repo, filePath, content, etag) {
    const cacheKey = getCacheKey(repo, filePath);
    const cacheFile = path.join(CACHE_DIR, cacheKey);
    const cacheContent = JSON.stringify({
      content,
      etag,
      timestamp: Date.now(),
    });

    try {
      await fs.promises.writeFile(cacheFile, cacheContent, "utf8");
    } catch (error) {
      handleFileSystemError(error, logger, "write", cacheFile);
    }
  }

  return {
    getCachedContent,
    setCachedContent,
  };
}
