import { jest } from "@jest/globals";
import { createContainer, asFunction, asValue } from "awilix";
// import * as config from "../src/config.js"; // Add this line

const mockConfig = {
  GITHUB_API_URL: "https://api.github.com",
  GITHUB_TOKEN: "test-token",
  ORG_NAME: "test-org",
};

// Mock axios
const mockGet = jest.fn();
const mockAxiosInstance = {
  get: mockGet,
  interceptors: {
    response: {
      use: jest.fn(),
    },
  },
};

describe("API Client module", () => {
  let container, apiClient, mockLogger;

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    container = createContainer();

    container.register({
      logger: asValue(mockLogger),
      config: asValue(mockConfig),
    });

    // Dynamically import the apiClient module
    const apiClientModule = await import("../src/api/apiClient.js");
    container.register({
      apiClient: asFunction((cradle) =>
        apiClientModule.createApiClient(
          cradle.logger,
          mockAxiosInstance,
          cradle.config
        )
      ).singleton(),
    });

    apiClient = container.resolve("apiClient");

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test("getOrgRepos calls axios with correct parameters", async () => {
    const mockResponse = { data: [{ name: "repo1" }, { name: "repo2" }] };
    mockGet.mockResolvedValueOnce(mockResponse);

    const result = await apiClient.getOrgRepos(1, 100);

    expect(mockGet).toHaveBeenCalledWith("/orgs/test-org/repos", {
      params: { page: 1, per_page: 100 },
    });
    expect(result).toEqual(mockResponse.data);
  });

  test("getRepoFileContent calls axios with correct parameters", async () => {
    const mockResponse = { data: { content: "base64EncodedContent" } };
    mockGet.mockResolvedValueOnce(mockResponse);

    const result = await apiClient.getRepoFileContent(
      "test-repo",
      "path/to/file.js"
    );

    expect(mockGet).toHaveBeenCalledWith(
      "/repos/test-org/test-repo/contents/path/to/file.js"
    );
    expect(result).toEqual(mockResponse.data);
  });

  test("getRepoDirectoryContents calls axios with correct parameters", async () => {
    const mockResponse = { data: [{ name: "file1.js" }, { name: "file2.js" }] };
    mockGet.mockResolvedValueOnce(mockResponse);

    const result = await apiClient.getRepoDirectoryContents(
      "test-repo",
      "path/to/dir"
    );

    expect(mockGet).toHaveBeenCalledWith(
      "/repos/test-org/test-repo/contents/path/to/dir"
    );
    expect(result).toEqual(mockResponse.data);
  });

  // Add more tests for error handling, rate limiting, etc.
});
