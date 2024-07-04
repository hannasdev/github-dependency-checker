const https = require("https");
const { GITHUB_API_URL, ORG_NAME, TOKEN, LIMIT } = require("./config");
const { getCachedContent, setCachedContent } = require("./cache");

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
      console.log(`Status Code: ${res.statusCode}`);

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const repos = JSON.parse(data);
            console.log("Repositories fetched:", repos.length);
            resolve(repos);
          } catch (error) {
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
      req.abort();
      reject(new Error("Request timed out"));
    });

    req.end();
  });
}

// Get content of a file from a repository
async function getFileContent(repo, filePath) {
  const fileOptions = {
    hostname: GITHUB_API_URL,
    path: `/repos/${ORG_NAME}/${repo}/contents/${filePath}`,
    method: "GET",
    headers: { ...headers },
  };

  const cachedData = await getCachedContent(repo, filePath);
  if (cachedData) {
    fileOptions.headers["If-None-Match"] = cachedData.etag;
  }

  return new Promise((resolve, reject) => {
    const fileReq = https.request(fileOptions, (fileRes) => {
      let fileData = "";

      fileRes.on("data", (chunk) => {
        fileData += chunk;
      });

      fileRes.on("end", async () => {
        if (fileRes.statusCode === 304) {
          // Content hasn't changed, use cached data
          console.log(`Using cached content for ${filePath} from ${repo}`);
          resolve(cachedData.content);
        } else if (fileRes.statusCode === 200) {
          try {
            const parsedData = JSON.parse(fileData);
            if (parsedData.content) {
              console.log(`Fetched ${filePath} from ${repo}`);
              await setCachedContent(
                repo,
                filePath,
                parsedData.content,
                fileRes.headers.etag
              );
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
      fileReq.abort();
      reject(new Error(`Request timed out for ${filePath} in ${repo}`));
    });

    fileReq.end();
  });
}

module.exports = { fetchRepos, getFileContent };
