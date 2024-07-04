const { INTERNAL_REPO_IDENTIFIER } = require("./config");
const { asyncErrorHandler } = require("./errorHandler");

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
        dependencyCount[dep].sources.push(repo);
      }
    });
  }

  return dependencyCount;
}

// Create graph data from dependencies
function createGraphData(repoDependencies, dependencyCount) {
  console.log("Creating graph data...");
  console.log("Input repoDependencies:", repoDependencies);
  console.log("Input dependencyCount:", dependencyCount);

  const nodes = [];
  const links = [];
  const nodeMap = {};

  for (const repo of Object.keys(repoDependencies)) {
    const node = { id: repo, depth: 0 };
    nodes.push(node);
    nodeMap[repo] = node;
  }

  for (const [dep, info] of Object.entries(dependencyCount)) {
    if (!nodeMap[dep]) {
      const node = { id: dep, count: info.count };
      nodes.push(node);
      nodeMap[dep] = node;
    }

    info.sources.forEach((source) => {
      links.push({
        source: source,
        target: dep,
        count: info.count,
      });

      if (nodeMap[source].depth + 1 > nodeMap[dep].depth) {
        nodeMap[dep].depth = nodeMap[source].depth + 1;
      }
    });
  }

  console.log("Output nodes:", nodes);
  console.log("Output links:", links);

  return { nodes, links };
}

const asyncCountDependencies = asyncErrorHandler(countDependencies);
const asyncCreateGraphData = asyncErrorHandler(createGraphData);

module.exports = {
  countDependencies: asyncCountDependencies,
  createGraphData: asyncCreateGraphData,
};
