// src/utils/graphUtils.js
export function calculateNodeSize(node) {
  return 5 + (node.weight || 1) * 2;
}

export function getNodeColor(node, colorScale) {
  return colorScale(node.group);
}

export function getLinkStrength(link) {
  return 1 / (link.value || 1);
}
