import container from "./dependencyContainer.js";
import { globalErrorHandler } from "./errorHandler.js";

async function main() {
  const { api, logger, graphBuilder, fileUtils } = container.cradle;

  try {
    const repos = await api.fetchRepos();
    logger.info(`Fetched ${repos.length} repositories`);

    const repoDependencies = await api.processRepos(repos, 2);
    logger.info("Finished processing repositories");

    const dependencyCount = graphBuilder.countDependencies(repoDependencies);
    const graphData = graphBuilder.createGraphData(
      repoDependencies,
      dependencyCount
    );

    await fileUtils.saveDependencies(graphData, logger);
    logger.info("Dependencies saved successfully");
  } catch (error) {
    globalErrorHandler(error, logger);
  }
}

main().catch((error) => {
  console.error("Unhandled error in main:", error);
  process.exit(1);
});
