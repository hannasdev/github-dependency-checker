import "./styles/styles.css";
import { GraphRenderer } from "./utils/graphRenderer.js";
import { DataLoader } from "./utils/dataLoader.js";
import { createLegend } from "./utils/legendUtils.js";
let graphRenderer;

export async function init() {
  const dataLoader = new DataLoader();
  const loadingElement = document.getElementById("loading");

  try {
    // Show "Loading...""
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

    // Hide "Loading...""
    if (loadingElement) loadingElement.style.display = "none";
  } catch (error) {
    console.error("Failed to load data:", error.message);
    console.error("Error stack:", error.stack);
    if (loadingElement) {
      loadingElement.textContent = "Error loading data. Please try again.";
    }
  }
}

export function setupEventListeners(graphRenderer) {
  const searchInput = document.getElementById("nodeNameInput");
  const searchButton = document.getElementById("searchButton");
  const zoomInButton = document.getElementById("zoomIn");
  const zoomOutButton = document.getElementById("zoomOut");
  const resetZoomButton = document.getElementById("resetZoom");

  if (searchButton) {
    searchButton.addEventListener("click", () => {
      const nodeName = searchInput ? searchInput.value : "";
      if (graphRenderer) {
        graphRenderer.centerOnNode(nodeName);
      } else {
        console.error("GraphRenderer is not initialized");
      }
    });
  }

  const handlers = {
    onSearch: (value) => {
      if (graphRenderer) {
        graphRenderer.centerOnNode(value);
      } else {
        console.error("GraphRenderer is not initialized");
      }
    },
    onZoomIn: () => graphRenderer && graphRenderer.zoom(1.2),
    onZoomOut: () => graphRenderer && graphRenderer.zoom(0.8),
    onResetZoom: () => graphRenderer && graphRenderer.resetZoom(),
  };

  zoomInButton.addEventListener("click", handlers.onZoomIn);
  zoomOutButton.addEventListener("click", handlers.onZoomOut);
  resetZoomButton.addEventListener("click", handlers.onResetZoom);

  return handlers;
}

init();
