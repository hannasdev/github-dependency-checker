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
  let container, api, mockApiClient, mockCache, mockLogger, mockProgressStorage;

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

    // Create a new container for each test
    container = createContainer();

    // Register mock dependencies
    container.register({
      apiClient: asValue(mockApiClient),
      cache: asValue(mockCache),
      logger: asValue(mockLogger),
      progressStorage: asValue(mockProgressStorage),
      config: asValue(await import("../src/config.js")),
      handleApiError: asValue((error, logger, message) => {
        throw new Error(`Error setting up the request: ${error.message}`);
      }),
      handleUnexpectedError: asValue(jest.fn()),
      scanRepository: asValue(jest.fn()),
    });

    // Dynamically import the api module
    const apiModule = await import("../src/api/api.js");
    container.register({
      api: asFunction(apiModule.createApi).singleton(),
    });

    // Resolve the api instance
    api = container.resolve("api");
  });

  test("fetchRepos returns an array of repositories with pagination", async () => {
    const mockRepos1 = [{ name: "repo1" }, { name: "repo2" }];
    const mockRepos2 = [{ name: "repo3" }];
    const mockRepos3 = []; // Empty array to signal end of pagination
    mockApiClient.getOrgRepos
      .mockResolvedValueOnce(mockRepos1)
      .mockResolvedValueOnce(mockRepos2)
      .mockResolvedValueOnce(mockRepos3);

    const repos = await api.fetchRepos();
    expect(Array.isArray(repos)).toBe(true);
    expect(repos).toEqual([...mockRepos1, ...mockRepos2]);
    expect(mockApiClient.getOrgRepos).toHaveBeenCalledTimes(3);
    expect(mockApiClient.getOrgRepos).toHaveBeenNthCalledWith(1, 1, 100);
    expect(mockApiClient.getOrgRepos).toHaveBeenNthCalledWith(2, 2, 100);
    expect(mockApiClient.getOrgRepos).toHaveBeenNthCalledWith(3, 3, 100);
  });

  test("fetchRepos handles empty response", async () => {
    mockApiClient.getOrgRepos.mockResolvedValue([]);

    const repos = await api.fetchRepos();
    expect(Array.isArray(repos)).toBe(true);
    expect(repos).toEqual([]);
    expect(mockApiClient.getOrgRepos).toHaveBeenCalledWith(1, 100);
  });

  test("fetchRepos handles undefined response", async () => {
    mockApiClient.getOrgRepos.mockResolvedValue(undefined);

    await expect(api.fetchRepos()).rejects.toThrow(
      "Error setting up the request: Invalid response from API"
    );
    expect(mockApiClient.getOrgRepos).toHaveBeenCalledWith(1, 100);
  });

  test("fetchRepos handles errors", async () => {
    const error = new Error("API error");
    mockApiClient.getOrgRepos.mockRejectedValue(error);

    await expect(api.fetchRepos()).rejects.toThrow(
      "Error setting up the request: API error"
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error in fetchRepos:",
      error
    );
  });

  test("getFileContent returns file content", async () => {
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

  test("getFileContent handles file not found", async () => {
    mockApiClient.getRepoFileContent.mockRejectedValueOnce({
      response: { status: 404 },
    });

    const content = await api.getFileContent("repo1", "non-existent-file.json");
    expect(content).toBeNull();
  });

  test("getFileContent handles errors", async () => {
    const error = new Error("Network error");
    mockApiClient.getRepoFileContent.mockRejectedValueOnce(error);

    await expect(api.getFileContent("repo1", "package.json")).rejects.toThrow(
      "Error setting up the request: Network error"
    );
  });

  // Add more tests for other api methods...
});
