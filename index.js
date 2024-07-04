require("dotenv").config();
const { fetchRepos } = require("./api");
const { processRepos } = require("./dependencyParser");
const { countDependencies, createGraphData } = require("./graphBuilder");
const { saveDependencies } = require("./fileUtils");
const { LIMIT } = require("./config");
const logger = require("./logger");

async function main() {
  try {
    logger.info("Starting dependency analysis");

    const repos = await fetchRepos(LIMIT);
    logger.info(`Fetched ${repos.length} repositories`);

    const repoDependencies = await processRepos(repos);
    const dependencyCount = countDependencies(repoDependencies);

    logger.info("Dependency count calculated");

    const graphData = createGraphData(repoDependencies, dependencyCount);
    await saveDependencies(graphData);

    logger.info("Dependency analysis completed successfully");
  } catch (error) {
    logger.error("Error in main process:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error("Unhandled error in main:", error);
    process.exit(1);
  });
}

module.exports = { main };
