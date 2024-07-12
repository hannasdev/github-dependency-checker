import { INTERNAL_REPO_IDENTIFIER } from "./config.js";
import { handleUnexpectedError } from "./errorHandler.js";

export function createGraphBuilder(logger) {
  function countDependencies(repoDependencies) {
    try {
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
    } catch (error) {
      handleUnexpectedError(error, logger, "Counting dependencies");
      return {};
    }
  }

  function createGraphData(repoDependencies, dependencyCount) {
    try {
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
    } catch (error) {
      handleUnexpectedError(error, logger, "Creating graph data");
      return { nodes: [], links: [] };
    }
  }

  return {
    countDependencies,
    createGraphData,
  };
}
