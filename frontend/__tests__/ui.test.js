import { GraphRenderer } from "../src/utils/graphRenderer.js";
import { DataLoader } from "../src/utils/dataLoader.js";
import "@testing-library/jest-dom";

jest.mock("../src/styles/styles.css", () => ({}), { virtual: true });

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

jest.mock("d3", () => ({}));
// Mock console.error to prevent it from cluttering our test output
console.error = jest.fn();
jest.mock("../src/utils/graphRenderer");

describe("Frontend Functionality", () => {
  describe("DataLoader", () => {
    it("correctly fetches and parses data", async () => {
      const mockData = { nodes: [], links: [] };
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const dataLoader = new DataLoader();
      const result = await dataLoader.loadData();

      expect(result).toEqual(mockData);
    });

    it("handles fetch errors", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network error"));

      const dataLoader = new DataLoader();
      await expect(dataLoader.loadData()).rejects.toThrow("Network error");
      expect(console.error).toHaveBeenCalledWith(
        "Error loading data:",
        expect.any(Error)
      );
    });
  });

  describe("GraphRenderer", () => {
    it("initializes correctly with valid data", () => {
      const container = document.createElement("div");
      const data = { nodes: [{ id: "node1" }], links: [] };
      const renderer = new GraphRenderer(container, data);

      expect(renderer.container).toBe(container);
      expect(renderer.data).toEqual(data);
    });

    it("handles invalid input gracefully", () => {
      const container = document.createElement("div");
      const invalidData = null;

      expect(() => new GraphRenderer(container, invalidData)).not.toThrow();
    });
  });
});
