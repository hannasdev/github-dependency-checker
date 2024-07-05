jest.mock("winston");
jest.mock("../config", () => ({
  INTERNAL_REPO_IDENTIFIER: "@internal/",
}));

const {
  countDependencies: asyncCountDependencies,
  createGraphData,
} = require("../graphBuilder");

describe("GraphBuilder module", () => {
  test("countDependencies returns correct count", async () => {
    const repoDependencies = {
      repo1: ["@internal/dep1", "@internal/dep2", "external-dep"],
      repo2: ["@internal/dep1", "@internal/dep3", "another-external-dep"],
    };

    const result = await asyncCountDependencies(repoDependencies);

    expect(result).toEqual({
      "@internal/dep1": { count: 2, sources: ["repo1", "repo2"] },
      "@internal/dep2": { count: 1, sources: ["repo1"] },
      "@internal/dep3": { count: 1, sources: ["repo2"] },
    });
  });

  test("createGraphData returns correct graph structure", () => {
    const repoDependencies = {
      repo1: ["@internal/dep1", "@internal/dep2"],
      repo2: ["@internal/dep1", "@internal/dep3"],
    };
    const dependencyCount = {
      "@internal/dep1": { count: 2, sources: ["repo1", "repo2"] },
      "@internal/dep2": { count: 1, sources: ["repo1"] },
      "@internal/dep3": { count: 1, sources: ["repo2"] },
    };

    const result = createGraphData(repoDependencies, dependencyCount);

    expect(result).toHaveProperty("nodes");
    expect(result).toHaveProperty("links");
    expect(result.nodes).toHaveLength(5); // 2 repos + 3 deps
    expect(result.links).toHaveLength(4); // 4 connections
  });
});
