require("dotenv").config();
const fs = require("fs");
const https = require("https");

// Environment Variables and Constants
const GITHUB_API_URL = "api.github.com";
const ORG_NAME = process.env.ORG_NAME;
const TOKEN = process.env.TOKEN;
const LIMIT = 10;
const INTERNAL_REPO_IDENTIFIER = process.env.REPO_IDENTIFIER;

console.log("ORG_NAME:", ORG_NAME);
console.log("TOKEN:", TOKEN ? "Loaded" : "Not Loaded");
console.log("TOKEN Length:", TOKEN?.length);

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

// Main function to fetch and process repositories
async function main() {
  try {
    const repos = await fetchRepos();
    const repoDependencies = await processRepos(repos);
    const dependencyCount = countDependencies(repoDependencies);
    console.log("Dependency Count:", dependencyCount);
    saveDependencies(createGraphData(repoDependencies, dependencyCount));
  } catch (error) {
    if (error.message.includes("GitHub API responded with status code")) {
      console.error("GitHub API Error:", error.message);
    } else if (error.message.includes("Request failed")) {
      console.error("Network Error:", error.message);
    } else if (error.message.includes("Request timed out")) {
      console.error("Timeout Error:", error.message);
    } else {
      console.error("Unexpected Error:", error.message);
    }
    process.exit(1); // Exit with error code
  }
}

// Fetch Repositories from GitHub
function fetchRepos() {
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

// Process each repository to get dependencies
async function processRepos(repos) {
  const repoDependencies = {};

  for (const repo of repos) {
    const repoName = repo.name;
    repoDependencies[repoName] = [];

    const dependencyFiles = [
      "package.json",
      "requirements.txt",
      "Gemfile",
      "pom.xml",
    ];

    for (const file of dependencyFiles) {
      const fileContent = await getFileContent(repoName, file);
      if (fileContent) {
        const deps = parseDependencies(file, fileContent);
        repoDependencies[repoName].push(...deps);
      }
    }

    console.log(`Parsing dependencies for ${repoName}...`);
  }

  return repoDependencies;
}

// Get content of a file from a repository
async function getFileContent(repo, path) {
  const fileOptions = {
    hostname: GITHUB_API_URL,
    path: `/repos/${ORG_NAME}/${repo}/contents/${path}`,
    method: "GET",
    headers: headers,
  };

  return new Promise((resolve, reject) => {
    const fileReq = https.request(fileOptions, (fileRes) => {
      let fileData = "";

      fileRes.on("data", (chunk) => {
        fileData += chunk;
      });

      fileRes.on("end", () => {
        if (fileRes.statusCode === 200) {
          try {
            const parsedData = JSON.parse(fileData);
            if (parsedData.content) {
              resolve(parsedData.content);
              console.log(`Fetched ${path} from ${repo}`);
            } else {
              reject(new Error(`No content found for ${path} in ${repo}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse file content: ${error.message}`));
          }
        } else if (fileRes.statusCode === 404) {
          resolve(null); // File not found, but not a critical error
        } else {
          reject(
            new Error(
              `GitHub API responded with status code ${fileRes.statusCode} for ${path} in ${repo}`
            )
          );
        }
      });
    });

    fileReq.on("error", (e) => {
      reject(new Error(`Request failed for ${path} in ${repo}: ${e.message}`));
    });

    fileReq.setTimeout(30000, () => {
      fileReq.abort();
      reject(new Error(`Request timed out for ${path} in ${repo}`));
    });

    fileReq.end();
  });
}

// Parse dependencies from file content
function parseDependencies(fileName, fileContent) {
  const content = Buffer.from(fileContent, "base64").toString("utf-8");
  let dependencies = [];

  switch (fileName) {
    case "package.json":
      const json = JSON.parse(content);
      dependencies = [
        ...Object.keys(json.dependencies || {}),
        ...Object.keys(json.devDependencies || {}),
      ];
      break;

    case "requirements.txt":
      dependencies = content
        .split("\n")
        .filter(Boolean)
        .map((dep) => dep.split("==")[0]);
      break;

    case "Gemfile":
      dependencies = content
        .split("\n")
        .filter((line) => line.startsWith("gem "))
        .map((line) => line.split(" ")[1].replace(/['",]/g, ""));
      break;

    case "pom.xml":
      const regex =
        /<dependency>[\s\S]*?<groupId>(.*?)<\/groupId>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?<\/dependency>/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        dependencies.push(`${match[1]}:${match[2]}`);
      }
      break;
  }

  return dependencies;
}

// Count internal dependencies
function countDependencies(repoDependencies) {
  const dependencyCount = {};

  for (const [repo, deps] of Object.entries(repoDependencies)) {
    deps.forEach((dep) => {
      if (dep.startsWith(INTERNAL_REPO_IDENTIFIER)) {
        if (!dependencyCount[dep]) {
          dependencyCount[dep] = { count: 0, sources: [] };
        }
        dependencyCount[dep].count += 1;
        dependencyCount[dep].sources.push(repo);
      }
    });
  }

  return dependencyCount;
}

// Create graph data from dependencies
function createGraphData(repoDependencies, dependencyCount) {
  const nodes = [];
  const links = [];
  const nodeMap = {};

  for (const repo of Object.keys(repoDependencies)) {
    const node = { id: repo, depth: 0 };
    nodes.push(node);
    nodeMap[repo] = node;
  }

  for (const [dep, info] of Object.entries(dependencyCount)) {
    if (!nodeMap[dep]) {
      const node = { id: dep, count: info.count };
      nodes.push(node);
      nodeMap[dep] = node;
    }

    info.sources.forEach((source) => {
      links.push({
        source: source,
        target: dep,
        count: info.count,
      });

      if (nodeMap[source].depth + 1 > nodeMap[dep].depth) {
        nodeMap[dep].depth = nodeMap[source].depth + 1;
      }
    });
  }

  return { nodes, links };
}

// Save dependencies to a file
async function saveDependencies(graphData) {
  const filePath = "dependencies.json";
  fs.writeFileSync(filePath, JSON.stringify(graphData, null, 2), "utf-8");
  console.log(`Dependencies saved to ${filePath}`);
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  saveDependencies,
  parseDependencies,
  createGraphData,
  countDependencies,
  getFileContent,
  processRepos,
  fetchRepos,
};
