import { GraphRenderer } from "../graphRenderer.js";
import { DataLoader } from "../dataLoader.js";
import "@testing-library/jest-dom";

// Mock D3
jest.mock("d3", () => ({
  select: jest.fn(() => ({
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
  })),
  zoom: jest.fn(() => ({
    scaleExtent: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),
  forceSimulation: jest.fn(() => ({
    force: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  })),
  drag: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
  })),
}));

describe("UI Functionality", () => {
  let graphRenderer;
  let container;
  let mockData;

  beforeEach(() => {
    container = document.createElement("div");
    mockData = {
      nodes: [{ id: "node1" }, { id: "node2" }],
      links: [{ source: "node1", target: "node2" }],
    };
    graphRenderer = new GraphRenderer(container, mockData);
  });

  test("GraphRenderer initializes correctly", () => {
    expect(graphRenderer).toBeDefined();
    expect(graphRenderer.container).toBe(container);
    expect(graphRenderer.data).toEqual(mockData);
  });

  test("GraphRenderer renders graph elements", () => {
    graphRenderer.render();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  test("DataLoader loads data correctly", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    );

    const dataLoader = new DataLoader();
    const data = await dataLoader.loadData("fake-url");
    expect(data).toEqual(mockData);
  });

  // Add more tests for zoom, pan, and search functionality
});
