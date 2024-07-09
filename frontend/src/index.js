import "./styles/styles.css";
import { GraphRenderer } from "./utils/graphRenderer.js";
import { DataLoader } from "./utils/dataLoader.js";
import { createLegend } from "./utils/legendUtils.js";
import { eventEmitter } from "./utils/eventEmitter.js";

let graphRenderer;

export async function init() {
  const dataLoader = new DataLoader();
  const loadingElement = document.getElementById("loading");

  try {
    if (loadingElement) loadingElement.style.display = "block";

    const data = await dataLoader.loadData();
    console.log("Data loaded:", data);

    const graphContainer = document.getElementById("graphContainer");
    if (!graphContainer) {
      throw new Error("Graph container element not found");
    }

    graphRenderer = new GraphRenderer(graphContainer, data);
    if (!graphRenderer) {
      throw new Error("Failed to create GraphRenderer instance");
    }
    graphRenderer.render();
    createLegend(data);
    setupEventListeners();
    setupGraphRendererListeners();

    if (loadingElement) loadingElement.style.display = "none";
  } catch (error) {
    console.error("Failed to load data:", error.message);
    console.error("Error stack:", error.stack);
    if (loadingElement) {
      loadingElement.textContent = "Error loading data. Please try again.";
    }
  }
}

export function setupEventListeners() {
  const searchInput = document.getElementById("nodeNameInput");
  const searchButton = document.getElementById("searchButton");
  const zoomInButton = document.getElementById("zoomIn");
  const zoomOutButton = document.getElementById("zoomOut");
  const resetZoomButton = document.getElementById("resetZoom");

  if (searchButton) {
    searchButton.addEventListener("click", () => {
      const nodeName = searchInput ? searchInput.value : "";
      eventEmitter.emit("search", nodeName);
    });
  }

  if (zoomInButton)
    zoomInButton.addEventListener("click", () => eventEmitter.emit("zoomIn"));
  if (zoomOutButton)
    zoomOutButton.addEventListener("click", () => eventEmitter.emit("zoomOut"));
  if (resetZoomButton)
    resetZoomButton.addEventListener("click", () =>
      eventEmitter.emit("resetZoom")
    );
}

function setupGraphRendererListeners() {
  eventEmitter.on("search", (nodeName) => {
    if (graphRenderer) {
      graphRenderer.centerOnNode(nodeName);
    } else {
      console.error("GraphRenderer is not initialized");
    }
  });

  eventEmitter.on("zoomIn", () => graphRenderer && graphRenderer.zoom(1.2));
  eventEmitter.on("zoomOut", () => graphRenderer && graphRenderer.zoom(0.8));
  eventEmitter.on(
    "resetZoom",
    () => graphRenderer && graphRenderer.resetZoom()
  );
}

init();
