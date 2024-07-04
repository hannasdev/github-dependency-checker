const {
  countDependencies: asyncCountDependencies,
  createGraphData: asyncCreateGraphData,
} = require("./graphBuilder");
const { saveDependencies: asyncSaveDependencies } = require("./fileUtils");
const { fetchRepos: asyncFetchRepos } = require("./api");
const { processRepos: asyncProcessRepos } = require("./dependencyParser");
const { LIMIT } = require("./config");
const logger = require("./logger");
const { asyncErrorHandler } = require("./errorHandler");

async function main() {
  logger.info("Starting dependency analysis");

  const repos = await asyncFetchRepos(LIMIT);
  logger.info(`Fetched ${repos.length} repositories`);

  const repoDependencies = await asyncProcessRepos(repos);
  console.log("Repo dependencies:", repoDependencies);

  const dependencyCount = await asyncCountDependencies(repoDependencies);
  console.log("Dependency count:", dependencyCount);

  logger.info("Dependency count calculated");

  const graphData = await asyncCreateGraphData(
    repoDependencies,
    dependencyCount
  );
  console.log("Graph data created:", graphData);

  await asyncSaveDependencies(graphData);

  logger.info("Dependency analysis completed successfully");
}

const asyncMain = asyncErrorHandler(main);

if (require.main === module) {
  asyncMain();
}

module.exports = { main: asyncMain };
