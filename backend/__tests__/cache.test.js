import { jest } from "@jest/globals";
import fs from "fs";
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock("path", () => ({
  join: jest.fn((_, key) => key),
}));

jest.mock("crypto", () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue("mockedHash"),
  }),
}));

jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

jest.mock("winston", () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
  }),
  format: {
    simple: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

jest.mock("../src/config.js", () => ({
  CACHE_DIR: "mock-cache-dir",
}));

describe("Cache module", () => {
  let getCachedContent, setCachedContent;

  beforeEach(async () => {
    jest.clearAllMocks();
    const cache = await import("../src/cache.js");
    getCachedContent = cache.getCachedContent;
    setCachedContent = cache.setCachedContent;
  });

  test("getCachedContent returns cached content if available", async () => {
    const mockCacheContent = {
      content: "cached content",
      etag: "etag123",
      timestamp: Date.now(),
    };

    fs.existsSync.mockReturnValue(true);
    fs.promises.readFile.mockResolvedValue(JSON.stringify(mockCacheContent));

    const result = await getCachedContent("repo1", "file1");

    expect(result).toEqual({
      content: "cached content",
      etag: "etag123",
    });
    expect(fs.promises.readFile).toHaveBeenCalled();
  });

  test("getCachedContent returns null if cache is not available", async () => {
    fs.existsSync.mockReturnValue(false);

    const result = await getCachedContent("repo1", "file1");

    expect(result).toBeNull();
    expect(fs.promises.readFile).not.toHaveBeenCalled();
  });

  test("setCachedContent writes content to cache", async () => {
    await setCachedContent("repo1", "file1", "new content", "new-etag");

    expect(fs.promises.writeFile).toHaveBeenCalled();
    const writeFileArg = fs.promises.writeFile.mock.calls[0][1];
    const parsedArg = JSON.parse(writeFileArg);
    expect(parsedArg).toEqual(
      expect.objectContaining({
        content: "new content",
        etag: "new-etag",
      })
    );
  });

  test("getCachedContent returns null for expired cache", async () => {
    const expiredCacheContent = {
      content: "expired content",
      etag: "etag123",
      timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
    };

    fs.existsSync.mockReturnValue(true);
    fs.promises.readFile.mockResolvedValue(JSON.stringify(expiredCacheContent));

    const result = await getCachedContent("repo1", "file1");

    expect(result).toBeNull();
  });
});
