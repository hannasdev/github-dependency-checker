import { jest } from "@jest/globals";

jest.mock("../src/logger.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("GraphBuilder module", () => {
  describe("countDependencies", () => {
    test("counts only internal dependencies", async () => {
      const repoDependencies = {
        repo1: ["@mock-org/dep1", "@mock-org/dep2", "external-dep"],
        repo2: ["@mock-org/dep1", "@mock-org/dep3", "another-external-dep"],
      };

      const result = countDependencies(repoDependencies);

      expect(result).toEqual({
        "@mock-org/dep1": { count: 2, sources: ["repo1", "repo2"] },
        "@mock-org/dep2": { count: 1, sources: ["repo1"] },
        "@mock-org/dep3": { count: 1, sources: ["repo2"] },
      });
      expect(result["external-dep"]).toBeUndefined();
      expect(result["another-external-dep"]).toBeUndefined();
    });
  });

  describe("createGraphData", () => {
    test("creates correct graph structure with proper depths", () => {
      const repoDependencies = {
        repo1: ["@mock-org/dep1", "@mock-org/dep2", "external-dep"],
        repo2: ["@mock-org/dep1", "@mock-org/dep3"],
      };
      const dependencyCount = {
        "@mock-org/dep1": { count: 2, sources: ["repo1", "repo2"] },
        "@mock-org/dep2": { count: 1, sources: ["repo1"] },
        "@mock-org/dep3": { count: 1, sources: ["repo2"] },
      };

      const result = createGraphData(repoDependencies, dependencyCount);

      expect(result.nodes).toHaveLength(5); // 2 repos + 3 internal deps
      expect(result.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "repo1", depth: 0 }),
          expect.objectContaining({ id: "repo2", depth: 0 }),
          expect.objectContaining({ id: "@mock-org/dep1", depth: 1 }),
          expect.objectContaining({ id: "@mock-org/dep2", depth: 1 }),
          expect.objectContaining({ id: "@mock-org/dep3", depth: 1 }),
        ])
      );

      expect(result.links).toHaveLength(4); // 4 internal dependency connections
      expect(result.links).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: "repo1",
            target: "@mock-org/dep1",
          }),
          expect.objectContaining({
            source: "repo1",
            target: "@mock-org/dep2",
          }),
          expect.objectContaining({
            source: "repo2",
            target: "@mock-org/dep1",
          }),
          expect.objectContaining({
            source: "repo2",
            target: "@mock-org/dep3",
          }),
        ])
      );

      expect(result.nodes.find((n) => n.id === "external-dep")).toBeUndefined();
      expect(
        result.links.find((l) => l.target === "external-dep")
      ).toBeUndefined();
    });

    test("handles multi-level dependencies correctly", () => {
      const repoDependencies = {
        repo1: ["@mock-org/dep1"],
        "@mock-org/dep1": ["@mock-org/dep2"],
        "@mock-org/dep2": ["@mock-org/dep3"],
      };
      const dependencyCount = {
        "@mock-org/dep1": { count: 1, sources: ["repo1"] },
        "@mock-org/dep2": { count: 1, sources: ["@mock-org/dep1"] },
        "@mock-org/dep3": { count: 1, sources: ["@mock-org/dep2"] },
      };

      const result = createGraphData(repoDependencies, dependencyCount);

      expect(result.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "repo1", depth: 0 }),
          expect.objectContaining({ id: "@mock-org/dep1", depth: 1 }),
          expect.objectContaining({ id: "@mock-org/dep2", depth: 2 }),
          expect.objectContaining({ id: "@mock-org/dep3", depth: 3 }),
        ])
      );

      expect(result.links).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: "repo1",
            target: "@mock-org/dep1",
          }),
          expect.objectContaining({
            source: "@mock-org/dep1",
            target: "@mock-org/dep2",
          }),
          expect.objectContaining({
            source: "@mock-org/dep2",
            target: "@mock-org/dep3",
          }),
        ])
      );
    });
  });
});
