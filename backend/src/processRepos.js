import container from "./dependencyContainer.js";
import pLimit from "p-limit";
import ProgressBar from "progress";
import { handleUnexpectedError } from "./errorHandler.js";

export async function processRepos(
  repos,
  maxDepth,
  concurrency = 10,
  batchSize = 50,
  dependencies
) {
  const { progressStorage, logger } = dependencies;
  const repoDependencies = progressStorage.getAllProgress();
  const remainingRepos = repos.filter((repo) => !repoDependencies[repo.name]);

  const limit = pLimit(concurrency);

  const bar = new ProgressBar(
    "Processing repositories [:bar] :current/:total :percent :etas",
    {
      complete: "=",
      incomplete: " ",
      width: 20,
      total: remainingRepos.length,
    }
  );

  logger.info(
    `Resuming from ${
      Object.keys(repoDependencies).length
    } previously processed repositories`
  );

  for (let i = 0; i < remainingRepos.length; i += batchSize) {
    const batch = remainingRepos.slice(i, i + batchSize);
    const promises = batch.map((repo) =>
      limit(async () => {
        try {
          const dependencies = await scanRepository(repo.name, maxDepth, {
            logger,
          });
          repoDependencies[repo.name] = dependencies;
          progressStorage.setRepoProgress(repo.name, dependencies);
          await progressStorage.save();
          bar.tick();
          logger.info(`Processed repository: ${repo.name}`);
        } catch (error) {
          handleUnexpectedError(
            error,
            logger,
            `Error processing repository ${repo.name}`
          );
          bar.tick();
        }
      })
    );

    await Promise.all(promises);

    if (i + batchSize < remainingRepos.length) {
      logger.info(
        `Completed batch. Waiting for 60 seconds before next batch...`
      );
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  }

  return repoDependencies;
}
