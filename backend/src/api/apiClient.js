import { jest } from "@jest/globals";
import { createContainer, asFunction, asValue } from "awilix";

// Mock dependencies
jest.mock("../src/config.js", () => ({
  GITHUB_API_URL: "api.github.com",
  ORG_NAME: "test-org",
  TOKEN: "test-token",
  LIMIT: 100,
}));

jest.mock("p-limit", () => jest.fn(() => jest.fn((fn) => fn())));
jest.mock("progress", () => jest.fn());

// Mock the ApiError class
class MockApiError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

describe("API module", () => {
  let container,
    api,
    mockApiClient,
    mockCache,
    mockLogger,
    mockProgressStorage,
    mockScanRepository;

  beforeEach(async () => {
    // Reset mocks
    mockApiClient = {
      getOrgRepos: jest.fn(),
      getRepoFileContent: jest.fn(),
      getRepoDirectoryContents: jest.fn(),
    };

    mockCache = {
      getCachedContent: jest.fn(),
      setCachedContent: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    mockProgressStorage = {
      getAllProgress: jest.fn(),
      setRepoProgress: jest.fn(),
      save: jest.fn(),
    };

    mockScanRepository = jest.fn();

    // Create a new container for each test
    container = createContainer();

    // Register mock dependencies
    container.register({
      apiClient: asValue(mockApiClient),
      cache: asValue(mockCache),
      logger: asValue(mockLogger),
      progressStorage: asValue(mockProgressStorage),
      config: asValue(await import("../src/config.js")),
      handleApiError: asValue(
        jest.fn((error, logger, message) => {
          throw new MockApiError(message, "REQUEST_SETUP_ERROR");
        })
      ),
      handleUnexpectedError: asValue(jest.fn()),
      scanRepository: asValue(mockScanRepository),
    });

    // Dynamically import the api module
    const apiModule = await import("../src/api/api.js");
    container.register({
      api: asFunction(apiModule.createApi).singleton(),
    });

    // Resolve the api instance
    api = container.resolve("api");
  });

  describe("fetchRepos", () => {
    test("returns an array of repositories", async () => {
      const mockRepos = [{ name: "repo1" }, { name: "repo2" }];
      mockApiClient.getOrgRepos.mockResolvedValueOnce(mockRepos);

      const repos = await api.fetchRepos();
      expect(Array.isArray(repos)).toBe(true);
      expect(repos).toEqual(mockRepos);
      expect(mockApiClient.getOrgRepos).toHaveBeenCalledWith(1, 100);
    });

    test("handles pagination", async () => {
      const mockRepos1 = [{ name: "repo1" }, { name: "repo2" }];
      const mockRepos2 = [{ name: "repo3" }];
      mockApiClient.getOrgRepos
        .mockResolvedValueOnce(mockRepos1)
        .mockResolvedValueOnce(mockRepos2)
        .mockResolvedValueOnce([]);

      const repos = await api.fetchRepos();
      expect(repos).toEqual([...mockRepos1, ...mockRepos2]);
      expect(mockApiClient.getOrgRepos).toHaveBeenCalledTimes(3);
    });

    test("handles errors", async () => {
      const error = new Error("API error");
      mockApiClient.getOrgRepos.mockRejectedValueOnce(error);

      await expect(api.fetchRepos()).rejects.toThrow(
        "Error fetching repositories"
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error in fetchRepos:",
        error
      );
    });
  });

  describe("getFileContent", () => {
    test("returns file content", async () => {
      const mockContent = Buffer.from("file content").toString("base64");
      mockApiClient.getRepoFileContent.mockResolvedValueOnce({
        content: mockContent,
      });

      const content = await api.getFileContent("repo1", "package.json");
      expect(content).toBe(mockContent);
      expect(mockApiClient.getRepoFileContent).toHaveBeenCalledWith(
        "repo1",
        "package.json"
      );
    });

    test("handles file not found", async () => {
      mockApiClient.getRepoFileContent.mockRejectedValueOnce({
        response: { status: 404 },
      });

      const content = await api.getFileContent(
        "repo1",
        "non-existent-file.json"
      );
      expect(content).toBeNull();
    });

    test("handles errors", async () => {
      const error = new Error("Network error");
      mockApiClient.getRepoFileContent.mockRejectedValueOnce(error);

      await expect(api.getFileContent("repo1", "package.json")).rejects.toThrow(
        "File not found: package.json in repo1"
      );
    });

    test("uses cache when available", async () => {
      const cachedContent = "cached content";
      mockCache.getCachedContent.mockResolvedValueOnce({
        content: cachedContent,
      });

      const content = await api.getFileContent("repo1", "package.json");
      expect(content).toBe(cachedContent);
      expect(mockApiClient.getRepoFileContent).not.toHaveBeenCalled();
    });
  });

  describe("getDirectoryContents", () => {
    test("returns directory contents", async () => {
      const mockContents = [{ name: "file1" }, { name: "file2" }];
      mockApiClient.getRepoDirectoryContents.mockResolvedValueOnce(
        mockContents
      );

      const contents = await api.getDirectoryContents("repo1", "src");
      expect(contents).toEqual(mockContents);
      expect(mockApiClient.getRepoDirectoryContents).toHaveBeenCalledWith(
        "repo1",
        "src"
      );
    });

    test("handles errors", async () => {
      const error = new Error("API error");
      mockApiClient.getRepoDirectoryContents.mockRejectedValueOnce(error);

      await expect(api.getDirectoryContents("repo1", "src")).rejects.toThrow(
        "Error fetching directory contents: src in repo1"
      );
    });
  });

  describe("processRepos", () => {
    test("processes repositories and returns dependencies", async () => {
      const mockRepos = [{ name: "repo1" }, { name: "repo2" }];
      const mockDependencies = ["dep1", "dep2"];
      mockProgressStorage.getAllProgress.mockReturnValue({});
      mockScanRepository.mockResolvedValue(mockDependencies);

      const result = await api.processRepos(mockRepos, 2);

      expect(result).toEqual({
        repo1: mockDependencies,
        repo2: mockDependencies,
      });
      expect(mockScanRepository).toHaveBeenCalledTimes(2);
      expect(mockProgressStorage.setRepoProgress).toHaveBeenCalledTimes(2);
      expect(mockProgressStorage.save).toHaveBeenCalledTimes(2);
    });

    test("handles errors during processing", async () => {
      const mockRepos = [{ name: "repo1" }, { name: "repo2" }];
      mockProgressStorage.getAllProgress.mockReturnValue({});
      mockScanRepository.mockRejectedValue(new Error("Scan error"));

      await api.processRepos(mockRepos, 2);

      expect(container.resolve("handleUnexpectedError")).toHaveBeenCalledTimes(
        2
      );
    });

    test("resumes from previously processed repositories", async () => {
      const mockRepos = [
        { name: "repo1" },
        { name: "repo2" },
        { name: "repo3" },
      ];
      const mockDependencies = ["dep1", "dep2"];
      mockProgressStorage.getAllProgress.mockReturnValue({
        repo1: mockDependencies,
      });
      mockScanRepository.mockResolvedValue(mockDependencies);

      await api.processRepos(mockRepos, 2);

      expect(mockScanRepository).toHaveBeenCalledTimes(2);
      expect(mockScanRepository).not.toHaveBeenCalledWith(
        "repo1",
        expect.anything()
      );
    });
  });
});
