require("dotenv").config();
const { fetchRepos } = require("./api");
const { processRepos } = require("./dependencyParser");
const { countDependencies, createGraphData } = require("./graphBuilder");
const { saveDependencies } = require("./fileUtils");
const { LIMIT } = require("./config");
const logger = require("./logger");
const { asyncErrorHandler } = require("./errorHandler");

async function main() {
  logger.info("Starting dependency analysis");

  const repos = await fetchRepos(LIMIT);
  logger.info(`Fetched ${repos.length} repositories`);

  const repoDependencies = await processRepos(repos);
  const dependencyCount = countDependencies(repoDependencies);

  logger.info("Dependency count calculated");

  const graphData = createGraphData(repoDependencies, dependencyCount);
  await saveDependencies(graphData);

  logger.info("Dependency analysis completed successfully");
}

if (require.main === module) {
  asyncErrorHandler(main)();
}

module.exports = { main };
