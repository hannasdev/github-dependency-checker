const nock = require("nock");
const { fetchRepos, getFileContent } = require("../api");
const { GITHUB_API_URL, ORG_NAME } = require("../config");

jest.mock("../config", () => ({
  GITHUB_API_URL: "api.github.com",
  ORG_NAME: "test-org",
  TOKEN: "test-token",
  LIMIT: 100,
}));

jest.mock("../cache", () => ({
  getCachedContent: jest.fn(),
  setCachedContent: jest.fn(),
}));

describe("API module", () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test("fetchRepos returns an array of repositories", async () => {
    const mockRepos = [{ name: "repo1" }, { name: "repo2" }];
    nock(`https://${GITHUB_API_URL}`)
      .get(`/orgs/${ORG_NAME}/repos`)
      .query(true)
      .reply(200, mockRepos);

    const repos = await fetchRepos();
    expect(Array.isArray(repos)).toBe(true);
    expect(repos).toEqual(mockRepos);
  });

  test("getFileContent returns file content", async () => {
    const mockContent = Buffer.from("file content").toString("base64");
    nock(`https://${GITHUB_API_URL}`)
      .get(`/repos/${ORG_NAME}/repo1/contents/package.json`)
      .reply(200, { content: mockContent });

    const content = await getFileContent("repo1", "package.json");
    expect(content).toBe(mockContent);
  });
});
