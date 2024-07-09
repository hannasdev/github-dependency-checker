// __tests__/graphRenderer.test.js
import { enableFetchMocks } from "jest-fetch-mock";
import { setupEventListeners } from "../src/index";
import { eventEmitter } from "../src/utils/eventEmitter";

enableFetchMocks();
jest.mock("../src/utils/dataLoader");
jest.mock("../src/utils/graphRenderer");
jest.mock("../src/styles/styles.css", () => ({}), { virtual: true });
jest.mock("../src/utils/legendUtils", () => ({
  createLegend: jest.fn(),
}));

describe("Event Handling", () => {
  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockResponseOnce(
      JSON.stringify({
        /* mock data */
      })
    );

    document.body.innerHTML = `
      <div id="loading"></div>
      <div id="graphContainer"></div>
      <input id="nodeNameInput" type="text">
      <button id="searchButton">Search</button>
      <button id="zoomIn">+</button>
      <button id="zoomOut">-</button>
      <button id="resetZoom">Reset</button>
      <div id="legend"></div>
    `;

    setupEventListeners();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("emits search event when search button is clicked", () => {
    const emitSpy = jest.spyOn(eventEmitter, "emit");
    document.getElementById("nodeNameInput").value = "testNode";
    document.getElementById("searchButton").click();
    expect(emitSpy).toHaveBeenCalledWith("search", "testNode");
  });

  test("emits zoomIn event when zoom in button is clicked", () => {
    const emitSpy = jest.spyOn(eventEmitter, "emit");
    document.getElementById("zoomIn").click();
    expect(emitSpy).toHaveBeenCalledWith("zoomIn");
  });

  test("emits zoomOut event when zoom out button is clicked", () => {
    const emitSpy = jest.spyOn(eventEmitter, "emit");
    document.getElementById("zoomOut").click();
    expect(emitSpy).toHaveBeenCalledWith("zoomOut");
  });

  test("emits resetZoom event when reset zoom button is clicked", () => {
    const emitSpy = jest.spyOn(eventEmitter, "emit");
    document.getElementById("resetZoom").click();
    expect(emitSpy).toHaveBeenCalledWith("resetZoom");
  });
});
