const { INTERNAL_REPO_IDENTIFIER } = require("./config");
const { asyncErrorHandler } = require("./errorHandler");
const logger = require("./logger");

// Count internal dependencies
function countDependencies(repoDependencies) {
  const dependencyCount = {};

  for (const [repo, deps] of Object.entries(repoDependencies)) {
    deps.forEach((dep) => {
      if (dep.startsWith(INTERNAL_REPO_IDENTIFIER)) {
        if (!dependencyCount[dep]) {
          dependencyCount[dep] = { count: 0, sources: [] };
        }
        dependencyCount[dep].count += 1;
        if (!dependencyCount[dep].sources.includes(repo)) {
          dependencyCount[dep].sources.push(repo);
        }
      }
    });
  }

  return dependencyCount;
}

function createGraphData(repoDependencies, dependencyCount) {
  const nodes = [];
  const links = [];
  const nodeMap = new Map();

  function getOrCreateNode(id, depth = 0) {
    if (!nodeMap.has(id)) {
      const node = { id, depth, count: dependencyCount[id]?.count || 0 };
      nodes.push(node);
      nodeMap.set(id, node);
    }
    return nodeMap.get(id);
  }

  function processRepo(repo, depth = 0, visited = new Set()) {
    if (visited.has(repo)) return;
    visited.add(repo);

    const repoNode = getOrCreateNode(repo, depth);
    const deps = repoDependencies[repo] || [];
    deps.forEach((dep) => {
      if (dep.startsWith(INTERNAL_REPO_IDENTIFIER)) {
        const existingDepNode = nodeMap.get(dep);
        const newDepth = Math.max(depth + 1, existingDepNode?.depth || 0);
        const depNode = getOrCreateNode(dep, newDepth);
        links.push({
          source: repoNode.id,
          target: depNode.id,
          count: dependencyCount[dep]?.count || 1,
        });
        processRepo(dep, depNode.depth, visited);
      }
    });
  }

  Object.keys(repoDependencies).forEach((repo) => processRepo(repo));

  return { nodes, links };
}

const asyncCreateGraphData = asyncErrorHandler(createGraphData);
const asyncCountDependencies = asyncErrorHandler(countDependencies);

module.exports = {
  countDependencies: asyncCountDependencies,
  createGraphData: asyncCreateGraphData,
  // Export unwrapped functions for testing
  _countDependencies: countDependencies,
  _createGraphData: createGraphData,
};
