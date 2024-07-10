import https from "https";
import path from "path";
import minimatch from "minimatch";
import { GITHUB_API_URL, ORG_NAME, TOKEN, LIMIT } from "./config.js";
import { asyncGetCachedContent, asyncSetCachedContent } from "./cache.js";
import { asyncErrorHandler } from "./errorHandler.js";
import { githubApiRequest } from "./githubApiRequest.js";
import logger from "./logger.js";

// HTTP Headers
const headers = {
  Authorization: `token ${TOKEN}`,
  "User-Agent": "Node.js",
  Accept: "application/vnd.github.v3+json",
};

async function fetchRepos() {
  let allRepos = [];
  let page = 1;
  const per_page = 100; // GitHub's max per page

  while (true) {
    const pageOptions = {
      hostname: GITHUB_API_URL,
      path: `/orgs/${ORG_NAME}/repos?per_page=${per_page}&page=${page}`,
      method: "GET",
      headers: {
        Authorization: `token ${TOKEN}`,
        "User-Agent": "Node.js",
        Accept: "application/vnd.github.v3+json",
      },
    };

    try {
      const pageRepos = await new Promise((resolve, reject) => {
        const req = https.request(pageOptions, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(
                new Error(
                  `GitHub API responded with status code ${res.statusCode}: ${data}`
                )
              );
            }
          });
        });

        req.on("error", (e) =>
          reject(new Error(`Request failed: ${e.message}`))
        );
        req.end();
      });

      if (pageRepos.length === 0) {
        break; // No more repos to fetch
      }

      allRepos = allRepos.concat(pageRepos);
      logger.info(`Fetched ${allRepos.length} repositories so far...`);

      if (allRepos.length >= LIMIT) {
        allRepos = allRepos.slice(0, LIMIT);
        break;
      }

      page++;
    } catch (error) {
      logger.error("Error fetching repositories:", error);
      throw error;
    }
  }

  logger.info(`Total repositories fetched: ${allRepos.length}`);
  return allRepos;
}

// Get content of a file from a repository
async function getFileContent(repo, filePath) {
  const cacheKey = `${repo}:${filePath}`;
  const cachedData = await asyncGetCachedContent(cacheKey);

  if (cachedData) {
    return cachedData.content;
  }

  const options = {
    hostname: GITHUB_API_URL,
    path: `/repos/${ORG_NAME}/${repo}/contents/${filePath}`,
    method: "GET",
    headers: {
      Authorization: `token ${TOKEN}`,
      "User-Agent": "Node.js",
      Accept: "application/vnd.github.v3+json",
    },
  };

  try {
    const data = await githubApiRequest(options);
    if (data.content) {
      await asyncSetCachedContent(cacheKey, {
        content: data.content,
        etag: data.sha,
      });
      return data.content;
    } else {
      logger.warn(`No content found for ${filePath} in ${repo}`);
      return null;
    }
  } catch (error) {
    if (error.message.includes("status code 404")) {
      logger.info(`File not found: ${filePath} in ${repo}`);
      return null;
    }
    throw error;
  }
}

async function getDirectoryContents(repo, path) {
  const options = {
    hostname: GITHUB_API_URL,
    path: `/repos/${ORG_NAME}/${repo}/contents/${path}`,
    method: "GET",
    headers: {
      Authorization: `token ${TOKEN}`,
      "User-Agent": "Node.js",
      Accept: "application/vnd.github.v3+json",
    },
  };

  try {
    const contents = await githubApiRequest(options);
    return contents;
  } catch (error) {
    if (error.message.includes("status code 404")) {
      return null; // Directory not found, but not a critical error
    }
    throw error;
  }
}

async function getMatchingDirectories(repoName, pattern) {
  const matchingDirs = [];

  async function traverse(currentPath = "") {
    try {
      const contents = await getDirectoryContents(repoName, currentPath);

      if (!contents || !Array.isArray(contents)) {
        return;
      }

      for (const item of contents) {
        if (item.type === "dir") {
          const relativePath = path.join(currentPath, item.name);
          if (minimatch(relativePath, pattern)) {
            matchingDirs.push(relativePath);
          }
          await traverse(relativePath);
        }
      }
    } catch (error) {
      logger.error(`Error traversing ${currentPath} in ${repoName}:`, error);
    }
  }

  await traverse();
  return matchingDirs;
}

// Wrap the async functions with asyncErrorHandler
export const asyncFetchRepos = asyncErrorHandler(fetchRepos);
export const asyncGetFileContent = asyncErrorHandler(getFileContent);
export const asyncGetDirectoryContents =
  asyncErrorHandler(getDirectoryContents);
export const asyncGetMatchingDirectories = asyncErrorHandler(
  getMatchingDirectories
);

export { fetchRepos, getFileContent }; // for test only
