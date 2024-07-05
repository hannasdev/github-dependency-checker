import { GraphRenderer } from "./graphRenderer.js";
import { DataLoader } from "./dataLoader.js";

const graphContainer = document.getElementById("graphContainer");
const searchInput = document.getElementById("nodeNameInput");
const searchButton = document.getElementById("searchButton");
const zoomInButton = document.getElementById("zoomIn");
const zoomOutButton = document.getElementById("zoomOut");
const resetZoomButton = document.getElementById("resetZoom");

let graphRenderer;

async function init() {
  const dataLoader = new DataLoader();
  const data = await dataLoader.loadData("dependencies.json");

  document.getElementById("loading").style.display = "none";

  graphRenderer = new GraphRenderer(graphContainer, data);
  graphRenderer.render();

  setupEventListeners();
  createLegend(data);
}

function setupEventListeners() {
  searchButton.addEventListener("click", () =>
    graphRenderer.centerOnNode(searchInput.value)
  );
  zoomInButton.addEventListener("click", () => graphRenderer.zoom(1.2));
  zoomOutButton.addEventListener("click", () => graphRenderer.zoom(0.8));
  resetZoomButton.addEventListener("click", () => graphRenderer.resetZoom());
}

function createLegend(data) {
  const legend = document.getElementById("legend");
  const depthColors = d3.scaleOrdinal(d3.schemeCategory10);

  data.nodes.forEach((node) => {
    if (node.depth !== undefined) {
      const item = document.createElement("div");
      item.style.color = depthColors(node.depth);
      item.textContent = `Depth ${node.depth}`;
      legend.appendChild(item);
    }
  });
}

init();
