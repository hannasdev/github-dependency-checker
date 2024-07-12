import pLimit from "p-limit";
import ProgressBar from "progress";
import { handleApiError, handleUnexpectedError } from "../errorHandler.js";
import { LIMIT } from "../config.js";
import { scanRepository } from "../repoScanner.js";

export function createApi({ apiClient, cache, logger, progressStorage }) {
  async function fetchRepos() {
    try {
      let allRepos = [];
      let page = 1;
      const per_page = 100;

      while (true) {
        logger.info(`Fetching page ${page} of repositories...`);
        const pageRepos = await apiClient.getOrgRepos(page, per_page);
        logger.info(`Fetched ${pageRepos.length} repositories on page ${page}`);

        if (pageRepos.length === 0) break;

        allRepos = allRepos.concat(pageRepos);
        logger.info(`Total repositories fetched so far: ${allRepos.length}`);

        if (allRepos.length >= LIMIT) {
          allRepos = allRepos.slice(0, LIMIT);
          break;
        }

        page++;
      }

      logger.info(`Final total repositories fetched: ${allRepos.length}`);
      return allRepos;
    } catch (error) {
      logger.error("Error in fetchRepos:", error);
      handleApiError(error, logger, "Error fetching repositories");
      return []; // Return an empty array in case of error
    }
  }

  async function getFileContent(repo, filePath) {
    try {
      const cacheKey = `${repo}:${filePath}`;
      const cachedData = await cache.getCachedContent(cacheKey);

      if (cachedData) {
        logger.info(`Cache hit for ${repo}:${filePath}`);
        return cachedData.content;
      }

      logger.info(`Fetching file content for ${repo}:${filePath}`);
      const fileData = await apiClient.getRepoFileContent(repo, filePath);
      if (fileData.content) {
        await cache.setCachedContent(cacheKey, {
          content: fileData.content,
          etag: fileData.sha,
        });
        return fileData.content;
      }
      logger.warn(`No content found for ${filePath} in ${repo}`);
      return null;
    } catch (error) {
      handleApiError(error, logger, `File not found: ${filePath} in ${repo}`);
      return null;
    }
  }

  async function getDirectoryContents(repo, dirPath) {
    try {
      logger.info(`Fetching directory contents for ${repo}:${dirPath}`);
      return await apiClient.getRepoDirectoryContents(repo, dirPath);
    } catch (error) {
      handleApiError(
        error,
        logger,
        `Error fetching directory contents: ${dirPath} in ${repo}`
      );
      return null;
    }
  }

  async function processRepos(
    repos,
    maxDepth,
    concurrency = 10,
    batchSize = 50
  ) {
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
            logger.info(`Scanning repository: ${repo.name}`);
            const dependencies = await scanRepository(repo.name, maxDepth, {
              logger,
              getFileContent,
              getDirectoryContents,
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

  return {
    fetchRepos,
    getFileContent,
    getDirectoryContents,
    processRepos,
  };
}
