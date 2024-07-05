const { INTERNAL_REPO_IDENTIFIER } = require("./config");
const { asyncErrorHandler } = require("./errorHandler");
const logger = require("./logger");

// Count internal dependencies
function countDependencies(repoDependencies) {
  const dependencyCount = {};

  const isInternalDependency = (dep) =>
    dep.startsWith(INTERNAL_REPO_IDENTIFIER);

  for (const [repo, deps] of Object.entries(repoDependencies)) {
    deps.filter(isInternalDependency).forEach((dep) => {
      if (!dependencyCount[dep]) {
        dependencyCount[dep] = { count: 0, sources: [] };
      }
      dependencyCount[dep].count += 1;
      dependencyCount[dep].sources.push(repo);
    });
  }

  return dependencyCount;
}

// Create graph data from dependencies
function createGraphData(repoDependencies, dependencyCount) {
  const nodes = [];
  const links = [];
  const nodeMap = new Map();

  const isInternalDependency = (dep) =>
    dep.startsWith(INTERNAL_REPO_IDENTIFIER);

  // First, create all nodes and assign depth 0 to root nodes
  for (const [repo, deps] of Object.entries(repoDependencies)) {
    if (!nodeMap.has(repo)) {
      const node = { id: repo, depth: 0 };
      nodes.push(node);
      nodeMap.set(repo, node);
    }

    deps.filter(isInternalDependency).forEach((dep) => {
      if (!nodeMap.has(dep)) {
        const node = { id: dep, depth: -1 }; // Initialize with -1, will update later
        nodes.push(node);
        nodeMap.set(dep, node);
      }
    });
  }

  // Create links and update depths
  for (const [repo, deps] of Object.entries(repoDependencies)) {
    deps.filter(isInternalDependency).forEach((dep) => {
      links.push({
        source: repo,
        target: dep,
        count: dependencyCount[dep]?.count || 1,
      });

      // Update depth if needed
      const depNode = nodeMap.get(dep);
      if (depNode.depth === -1 || depNode.depth > nodeMap.get(repo).depth + 1) {
        depNode.depth = nodeMap.get(repo).depth + 1;
      }
    });
  }

  // Assign count to nodes
  nodes.forEach((node) => {
    node.count = dependencyCount[node.id]?.count || 0;
  });

  return { nodes, links };
}

const asyncCreateGraphData = asyncErrorHandler(createGraphData);
const asyncCountDependencies = asyncErrorHandler(countDependencies);

module.exports = {
  countDependencies: asyncCountDependencies,
  createGraphData: asyncCreateGraphData,
  createGraphData, // For tests only
};
