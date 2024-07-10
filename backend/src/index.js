import { asyncFetchRepos } from "./api.js";
import { asyncProcessRepos } from "./dependencyParser.js";
import { LIMIT } from "./config.js";
import logger from "./logger.js";
import { asyncErrorHandler } from "./errorHandler.js";
import {
  asyncCountDependencies,
  asyncCreateGraphData,
} from "./graphBuilder.js";
import { asyncSaveDependencies } from "./fileUtils.js";
import { ProgressStorage } from "./progressStorage.js";

async function main() {
  logger.info("Starting dependency analysis");

  const progressStorage = new ProgressStorage();
  await progressStorage.load();

  const repos = await asyncFetchRepos(LIMIT);
  logger.info(`Fetched ${repos.length} repositories`);

  const repoDependencies = await asyncProcessRepos(repos, 3, 10); // Using 10 for concurrency
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

  // Clear progress after successful completion
  await progressStorage.clear();

  logger.info("Dependency analysis completed successfully");
}

const asyncMain = asyncErrorHandler(main);

asyncMain();
