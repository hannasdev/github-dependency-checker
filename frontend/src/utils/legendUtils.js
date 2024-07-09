import * as d3 from "d3";

export function createLegend(data) {
  const legend = document.getElementById("legend");
  if (!legend) {
    console.error("Legend element not found");
    return;
  }
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
