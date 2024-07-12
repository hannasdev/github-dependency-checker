import { jest } from "@jest/globals";
import { createContainer, asFunction, asValue } from "awilix";

// Mock axios
const mockGet = jest.fn();
const mockAxios = {
  create: jest.fn(() => ({
    get: mockGet,
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  })),
};
jest.mock("axios", () => mockAxios);

describe("API Client module", () => {
  let container, apiClient, mockLogger;

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    container = createContainer();

    container.register({
      axios: asValue(mockAxios),
      logger: asValue(mockLogger),
      config: asValue({
        GITHUB_API_URL: "https://api.github.com",
        GITHUB_TOKEN: "test-token",
        ORG_NAME: "test-org",
      }),
    });

    // Dynamically import the apiClient module
    const apiClientModule = await import("../src/api/apiClient.js");
    container.register({
      apiClient: asFunction(apiClientModule.createApiClient).singleton(),
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

    await apiClient.getRepoFileContent("test-repo", "path/to/file.js");

    expect(mockGet).toHaveBeenCalledWith(
      "/repos/test-org/test-repo/contents/path/to/file.js"
    );
  });

  test("getRepoDirectoryContents calls axios with correct parameters", async () => {
    const mockResponse = { data: [{ name: "file1.js" }, { name: "file2.js" }] };
    mockGet.mockResolvedValueOnce(mockResponse);

    await apiClient.getRepoDirectoryContents("test-repo", "path/to/dir");

    expect(mockGet).toHaveBeenCalledWith(
      "/repos/test-org/test-repo/contents/path/to/dir"
    );
  });

  // Add more tests for error handling, rate limiting, etc.
});
