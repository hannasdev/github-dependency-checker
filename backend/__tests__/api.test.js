import { jest } from "@jest/globals";
import axios from "axios";

jest.mock("axios", () => ({
  get: jest.fn(),
}));

jest.mock("../src/config.js", () => ({
  GITHUB_API_URL: "api.github.com",
  ORG_NAME: "test-org",
  TOKEN: "test-token",
  LIMIT: 100,
}));

jest.mock("../src/cache.js", () => ({
  asyncGetCachedContent: jest.fn(),
  asyncSetCachedContent: jest.fn(),
}));

jest.mock("../src/logger.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("API module", () => {
  let fetchRepos, getFileContent;

  beforeEach(async () => {
    jest.clearAllMocks();
    const api = await import("../src/api/api.js");
    fetchRepos = api.fetchRepos;
    getFileContent = api.getFileContent;
  });

  test("fetchRepos returns an array of repositories", async () => {
    const mockRepos = [{ name: "repo1" }, { name: "repo2" }];
    axios.get.mockResolvedValueOnce({ data: mockRepos });

    const repos = await fetchRepos();
    expect(Array.isArray(repos)).toBe(true);
    expect(repos).toEqual(mockRepos);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/orgs/test-org/repos"),
      expect.any(Object)
    );
  });

  test("getFileContent returns file content", async () => {
    const mockContent = Buffer.from("file content").toString("base64");
    axios.get.mockResolvedValueOnce({ data: { content: mockContent } });

    const content = await getFileContent("repo1", "package.json");
    expect(content).toBe(mockContent);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/repos/test-org/repo1/contents/package.json")
    );
  });

  test("fetchRepos handles pagination", async () => {
    const mockRepos1 = [{ name: "repo1" }, { name: "repo2" }];
    const mockRepos2 = [{ name: "repo3" }];
    axios.get
      .mockResolvedValueOnce({ data: mockRepos1 })
      .mockResolvedValueOnce({ data: mockRepos2 })
      .mockResolvedValueOnce({ data: [] });

    const repos = await fetchRepos();
    expect(repos).toEqual([...mockRepos1, ...mockRepos2]);
    expect(axios.get).toHaveBeenCalledTimes(3);
  });

  test("getFileContent handles file not found", async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 404 } });

    const content = await getFileContent("repo1", "non-existent-file.json");
    expect(content).toBeNull();
  });

  test("getFileContent throws error for non-404 errors", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    await expect(getFileContent("repo1", "package.json")).rejects.toThrow(
      "Network error"
    );
  });
});
