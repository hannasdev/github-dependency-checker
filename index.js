require("dotenv").config();
const { fetchRepos } = require("./api");
const { processRepos } = require("./dependencyParser");
const { countDependencies, createGraphData } = require("./graphBuilder");
const { wrappedSaveDependencies } = require("./fileUtils");
const { LIMIT } = require("./config");
const logger = require("./logger");
const { asyncErrorHandler } = require("./errorHandler");

async function main() {
  logger.info("Starting dependency analysis");

  const repos = await fetchRepos(LIMIT);
  logger.info(`Fetched ${repos.length} repositories`);

  const repoDependencies = await processRepos(repos);
  console.log("Repo dependencies:", repoDependencies); // Add this line

  const dependencyCount = await countDependencies(repoDependencies);
  console.log("Dependency count:", dependencyCount); // Add this line

  logger.info("Dependency count calculated");

  const graphData = await createGraphData(repoDependencies, dependencyCount);
  console.log("Graph data created:", graphData); // Add this line

  await wrappedSaveDependencies(graphData);

  logger.info("Dependency analysis completed successfully");
}

if (require.main === module) {
  asyncErrorHandler(main)();
}

module.exports = { main };
