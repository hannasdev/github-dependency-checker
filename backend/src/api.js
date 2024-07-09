import https from "https";
import path from "path";
import * as minimatch from "minimatch";
import { GITHUB_API_URL, ORG_NAME, TOKEN, LIMIT } from "./config.js";
import { asyncGetCachedContent, asyncSetCachedContent } from "./cache.js";
import { asyncErrorHandler } from "./errorHandler.js";
import logger from "./logger.js";

// HTTP Headers
const headers = {
  Authorization: `token ${TOKEN}`,
  "User-Agent": "Node.js",
  Accept: "application/vnd.github.v3+json",
};

// Options for GitHub API request
const options = {
  hostname: GITHUB_API_URL,
  path: `/orgs/${ORG_NAME}/repos?per_page=${LIMIT}`,
  method: "GET",
  headers: headers,
};

// Fetch Repositories from GitHub
async function fetchRepos() {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      logger.info(`Status Code: ${res.statusCode}`);

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const repos = JSON.parse(data);
            logger.info("Repositories fetched:", repos.length);
            resolve(repos);
          } catch (error) {
            logger.error("Error parsing data:", error);
            reject(
              new Error(`Failed to parse repository data: ${error.message}`)
            );
          }
        } else {
          reject(
            new Error(
              `GitHub API responded with status code ${res.statusCode}: ${data}`
            )
          );
        }
      });
    });

    req.on("error", (e) => {
      reject(new Error(`Request failed: ${e.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    req.end();
  });
}

// Get content of a file from a repository
async function getFileContent(repo, filePath) {
  const cacheKey = `${repo}:${filePath}`;
  const cachedData = await asyncGetCachedContent(cacheKey);

  if (cachedData) {
    return cachedData.content;
  }

  const fileOptions = {
    hostname: GITHUB_API_URL,
    path: `/repos/${ORG_NAME}/${repo}/contents/${filePath}`,
    method: "GET",
    headers: { ...headers },
  };

  return new Promise((resolve, reject) => {
    const fileReq = https.request(fileOptions, (fileRes) => {
      let fileData = "";

      fileRes.on("data", (chunk) => {
        fileData += chunk;
      });

      fileRes.on("end", async () => {
        if (fileRes.statusCode === 200) {
          try {
            const parsedData = JSON.parse(fileData);
            if (parsedData.content) {
              await asyncSetCachedContent(cacheKey, {
                content: parsedData.content,
                etag: fileRes.headers.etag,
              });
              resolve(parsedData.content);
            } else {
              reject(new Error(`No content found for ${filePath} in ${repo}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse file content: ${error.message}`));
          }
        } else if (fileRes.statusCode === 404) {
          resolve(null); // File not found, but not a critical error
        } else {
          reject(
            new Error(
              `GitHub API responded with status code ${fileRes.statusCode} for ${filePath} in ${repo}`
            )
          );
        }
      });
    });

    fileReq.on("error", (e) => {
      reject(
        new Error(`Request failed for ${filePath} in ${repo}: ${e.message}`)
      );
    });

    fileReq.setTimeout(30000, () => {
      fileReq.destroy();
      reject(new Error(`Request timed out for ${filePath} in ${repo}`));
    });

    fileReq.end();
  });
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

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const contents = JSON.parse(data);
            resolve(contents);
          } catch (error) {
            reject(
              new Error(`Failed to parse directory contents: ${error.message}`)
            );
          }
        } else if (res.statusCode === 404) {
          resolve(null); // Directory not found, but not a critical error
        } else {
          reject(
            new Error(`GitHub API responded with status code ${res.statusCode}`)
          );
        }
      });
    });

    req.on("error", (e) => {
      reject(new Error(`Request failed: ${e.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(
        new Error(
          `Request timed out for directory contents of ${path} in ${repo}`
        )
      );
    });

    req.end();
  });
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
          if (minimatch.default(relativePath, pattern)) {
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
