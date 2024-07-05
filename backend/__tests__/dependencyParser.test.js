const { processRepos, parseDependencies } = require("../src/dependencyParser");
const { getFileContent } = require("../src/api");

jest.mock("../src/api");
jest.mock("winston");
describe("DependencyParser module", () => {
  test("processRepos returns dependencies for each repo", async () => {
    getFileContent.mockResolvedValueOnce(
      Buffer.from(
        JSON.stringify({
          dependencies: { dep1: "1.0.0", dep2: "2.0.0" },
        })
      ).toString("base64")
    );

    const repos = [{ name: "repo1" }];
    const result = await processRepos(repos);

    expect(result).toEqual({
      repo1: ["dep1", "dep2"],
    });
  });

  test("parseDependencies extracts dependencies from package.json", () => {
    const content = Buffer.from(
      JSON.stringify({
        dependencies: { dep1: "1.0.0", dep2: "2.0.0" },
      })
    ).toString("base64");

    const result = parseDependencies("package.json", content);

    expect(result).toEqual(["dep1", "dep2"]);
  });
});
