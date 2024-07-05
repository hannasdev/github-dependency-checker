import "./styles/styles.css";
import { GraphRenderer } from "./utils/graphRenderer.js";
import { DataLoader } from "./utils/dataLoader.js";

const graphContainer = document.getElementById("graphContainer");
const searchInput = document.getElementById("nodeNameInput");
const searchButton = document.getElementById("searchButton");
const zoomInButton = document.getElementById("zoomIn");
const zoomOutButton = document.getElementById("zoomOut");
const resetZoomButton = document.getElementById("resetZoom");

let graphRenderer;

async function init() {
  const dataLoader = new DataLoader();
  const data = await dataLoader.loadData("../../shared/data/dependencies.json");

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
  legend.innerHTML = ""; // Clear any existing content

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Get unique depth values
  const uniqueDepths = [...new Set(data.nodes.map((node) => node.depth))].sort(
    (a, b) => a - b
  );

  // Create legend items
  uniqueDepths.forEach((depth) => {
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.marginBottom = "5px";

    const colorBox = document.createElement("div");
    colorBox.style.width = "20px";
    colorBox.style.height = "20px";
    colorBox.style.backgroundColor = colorScale(depth);
    colorBox.style.marginRight = "5px";

    const label = document.createElement("span");
    label.textContent = `Depth ${depth}`;

    item.appendChild(colorBox);
    item.appendChild(label);
    legend.appendChild(item);
  });

  // Add information about node size
  const sizeInfo = document.createElement("div");
  sizeInfo.style.marginTop = "10px";
  sizeInfo.textContent = "Node size represents dependency count";
  legend.appendChild(sizeInfo);
}

init();
