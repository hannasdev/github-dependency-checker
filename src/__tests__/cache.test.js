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
  resolve: jest.fn((...args) => args.join("/")),
}));

jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

jest.mock("../config", () => ({
  CACHE_DIR: "mock-cache-dir",
}));

jest.mock("winston");

const fs = require("fs").promises;
const cache = require("../cache");

describe("Cache module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getCachedContent returns cached content if available", async () => {
    const mockCacheContent = {
      content: "cached content",
      etag: "etag123",
      timestamp: Date.now(),
    };

    require("fs").existsSync.mockReturnValue(true);
    fs.readFile.mockResolvedValue(JSON.stringify(mockCacheContent));

    const result = await cache.getCachedContent("repo1", "file1");

    expect(result).toEqual({
      content: "cached content",
      etag: "etag123",
    });
    expect(fs.readFile).toHaveBeenCalled();
  });

  test("getCachedContent returns null if cache is not available", async () => {
    require("fs").existsSync.mockReturnValue(false);

    const result = await cache.getCachedContent("repo1", "file1");

    expect(result).toBeNull();
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  test("setCachedContent writes content to cache", async () => {
    await cache.setCachedContent("repo1", "file1", "new content", "new-etag");

    expect(fs.writeFile).toHaveBeenCalled();
    const writeFileArg = fs.writeFile.mock.calls[0][1];
    const parsedArg = JSON.parse(writeFileArg);
    expect(parsedArg).toEqual(
      expect.objectContaining({
        content: "new content",
        etag: "new-etag",
      })
    );
  });
});
