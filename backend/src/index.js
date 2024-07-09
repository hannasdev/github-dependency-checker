import { asyncProcessRepos } from "./dependencyParser.js";
import { asyncFetchRepos } from "./api.js";
import { LIMIT } from "./config.js";
import logger from "./logger.js";
import { asyncErrorHandler } from "./errorHandler.js";
import {
  asyncCountDependencies,
  asyncCreateGraphData,
} from "./graphBuilder.js";
import { asyncSaveDependencies } from "./fileUtils.js";

async function main() {
  logger.info("Starting dependency analysis");

  const repos = await asyncFetchRepos(LIMIT);
  logger.info(`Fetched ${repos.length} repositories`);

  const repoDependencies = await asyncProcessRepos(repos, 3, 20); // Using 20 for concurrency
  logger.info("Dependencies processed");

  const dependencyCount = await asyncCountDependencies(repoDependencies);
  logger.info("Dependencies counted");

  const graphData = await asyncCreateGraphData(
    repoDependencies,
    dependencyCount
  );
  logger.info("Graph data created");

  await asyncSaveDependencies(graphData);
  logger.info("Graph data saved");

  logger.info("Dependency analysis completed successfully");
}

const asyncMain = asyncErrorHandler(main);

asyncMain();

export { main as default };
