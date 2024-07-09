import { countDependencies, createGraphData } from "../src/graphBuilder";

jest.mock("winston");
jest.mock("../src/config", () => ({
  INTERNAL_REPO_IDENTIFIER: "@acast-tech/",
}));

describe("GraphBuilder module", () => {
  describe("countDependencies", () => {
    test("counts only internal dependencies", async () => {
      const repoDependencies = {
        repo1: ["@acast-tech/dep1", "@acast-tech/dep2", "external-dep"],
        repo2: ["@acast-tech/dep1", "@acast-tech/dep3", "another-external-dep"],
      };

      const result = countDependencies(repoDependencies);

      expect(result).toEqual({
        "@acast-tech/dep1": { count: 2, sources: ["repo1", "repo2"] },
        "@acast-tech/dep2": { count: 1, sources: ["repo1"] },
        "@acast-tech/dep3": { count: 1, sources: ["repo2"] },
      });
      expect(result["external-dep"]).toBeUndefined();
      expect(result["another-external-dep"]).toBeUndefined();
    });
  });

  describe("createGraphData", () => {
    test("creates correct graph structure with proper depths", () => {
      const repoDependencies = {
        repo1: ["@acast-tech/dep1", "@acast-tech/dep2", "external-dep"],
        repo2: ["@acast-tech/dep1", "@acast-tech/dep3"],
      };
      const dependencyCount = {
        "@acast-tech/dep1": { count: 2, sources: ["repo1", "repo2"] },
        "@acast-tech/dep2": { count: 1, sources: ["repo1"] },
        "@acast-tech/dep3": { count: 1, sources: ["repo2"] },
      };

      const result = createGraphData(repoDependencies, dependencyCount);

      // Check nodes
      expect(result.nodes).toHaveLength(5); // 2 repos + 3 internal deps
      expect(result.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "repo1", depth: 0 }),
          expect.objectContaining({ id: "repo2", depth: 0 }),
          expect.objectContaining({ id: "@acast-tech/dep1", depth: 1 }),
          expect.objectContaining({ id: "@acast-tech/dep2", depth: 1 }),
          expect.objectContaining({ id: "@acast-tech/dep3", depth: 1 }),
        ])
      );

      // Check links
      expect(result.links).toHaveLength(4); // 4 internal dependency connections
      expect(result.links).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: "repo1",
            target: "@acast-tech/dep1",
          }),
          expect.objectContaining({
            source: "repo1",
            target: "@acast-tech/dep2",
          }),
          expect.objectContaining({
            source: "repo2",
            target: "@acast-tech/dep1",
          }),
          expect.objectContaining({
            source: "repo2",
            target: "@acast-tech/dep3",
          }),
        ])
      );

      // Ensure no external dependencies are included
      expect(result.nodes.find((n) => n.id === "external-dep")).toBeUndefined();
      expect(
        result.links.find((l) => l.target === "external-dep")
      ).toBeUndefined();
    });

    test("handles multi-level dependencies correctly", () => {
      const repoDependencies = {
        repo1: ["@acast-tech/dep1"],
        "@acast-tech/dep1": ["@acast-tech/dep2"],
        "@acast-tech/dep2": ["@acast-tech/dep3"],
      };
      const dependencyCount = {
        "@acast-tech/dep1": { count: 1, sources: ["repo1"] },
        "@acast-tech/dep2": { count: 1, sources: ["@acast-tech/dep1"] },
        "@acast-tech/dep3": { count: 1, sources: ["@acast-tech/dep2"] },
      };

      const result = createGraphData(repoDependencies, dependencyCount);

      expect(result.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "repo1", depth: 0 }),
          expect.objectContaining({ id: "@acast-tech/dep1", depth: 1 }),
          expect.objectContaining({ id: "@acast-tech/dep2", depth: 2 }),
          expect.objectContaining({ id: "@acast-tech/dep3", depth: 3 }),
        ])
      );
    });
  });
});
