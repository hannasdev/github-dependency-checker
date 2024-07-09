// __tests__/graphRenderer.test.js
import { enableFetchMocks } from "jest-fetch-mock";
import { GraphRenderer } from "../src/utils/graphRenderer";
import { setupEventListeners } from "../src/index";

enableFetchMocks();
jest.mock("../src/utils/dataLoader");
jest.mock("../src/utils/graphRenderer");
jest.mock("../src/styles/styles.css", () => ({}), { virtual: true });
jest.mock("../src/utils/legendUtils", () => ({
  createLegend: jest.fn(),
}));

describe("Event Handling", () => {
  let graphRenderer;

  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockResponseOnce(
      JSON.stringify({
        /* mock data */
      })
    );
    document.body.innerHTML = `
      <div id="graphContainer" style="width: 500px; height: 500px;"></div>
      <input id="nodeNameInput" type="text">
      <button id="searchButton">Search</button>
      <button id="zoomIn">+</button>
      <button id="zoomOut">-</button>
      <button id="resetZoom">Reset</button>
      <div id="legend"></div>
    `;

    graphRenderer = new GraphRenderer(document.body, { nodes: [], links: [] });
    graphRenderer.zoom = jest.fn();
    graphRenderer.resetZoom = jest.fn();
    handlers = setupEventListeners(graphRenderer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("triggers centerOnNode when search button is clicked", () => {
    document.getElementById("nodeNameInput").value = "testNode";
    document.getElementById("searchButton").click();
    expect(graphRenderer.centerOnNode).toHaveBeenCalledWith("testNode");
  });

  test("triggers zoom in when zoom in button is clicked", () => {
    document.getElementById("zoomIn").click();
    expect(graphRenderer.zoom).toHaveBeenCalledWith(1.2);
    expect(graphRenderer.zoom).toHaveBeenCalledTimes(1);
  });

  test("triggers zoom out when zoom out button is clicked", () => {
    document.getElementById("zoomOut").click();
    expect(graphRenderer.zoom).toHaveBeenCalledWith(0.8);
  });

  test("triggers resetZoom when reset zoom button is clicked", () => {
    document.getElementById("resetZoom").click();
    expect(graphRenderer.resetZoom).toHaveBeenCalled();
  });

  test("handles GraphRenderer not being initialized", () => {
    console.error = jest.fn();
    setupEventListeners(null);
    document.getElementById("searchButton").click();
    expect(console.error).toHaveBeenCalledWith(
      "GraphRenderer is not initialized"
    );
  });
});
