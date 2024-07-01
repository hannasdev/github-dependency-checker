require("dotenv").config();
const fs = require("fs");
const https = require("https");

const GITHUB_API_URL = "api.github.com";
const ORG_NAME = process.env.ORG_NAME;
const TOKEN = process.env.TOKEN;

console.log("ORG_NAME:", ORG_NAME);
console.log("TOKEN:", TOKEN ? "Loaded" : "Not Loaded");
console.log("TOKEN Length:", TOKEN.length);

const headers = {
  Authorization: `token ${TOKEN}`,
  "User-Agent": "Node.js",
  Accept: "application/vnd.github.v3+json",
};

const options = {
  hostname: GITHUB_API_URL,
  path: `/orgs/${ORG_NAME}/repos?per_page=2`, // Limit to 2 repositories
  method: "GET",
  headers: headers,
};

const req = https.request(options, (res) => {
  let data = "";

  console.log(`Status Code: ${res.statusCode}`);

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", async () => {
    if (res.statusCode === 200) {
      const repos = JSON.parse(data);
      console.log("Repositories fetched:", repos);

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
      }

      const internalRepos = repos.map((repo) => repo.name);
      const dependencyCount = {};

      for (const [repo, deps] of Object.entries(repoDependencies)) {
        deps.forEach((dep) => {
          if (dep.startsWith("@acast-tech/")) {
            if (!dependencyCount[dep]) {
              dependencyCount[dep] = { count: 0, sources: [] };
            }
            dependencyCount[dep].count += 1;
            dependencyCount[dep].sources.push(repo);
          }
        });
      }

      console.log("Dependency Count:", dependencyCount);
      saveDependencies(createGraphData(dependencyCount));
    } else {
      console.log("Error:", JSON.parse(data));
    }
  });
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();

async function getFileContent(repo, path) {
  return new Promise((resolve, reject) => {
    const fileOptions = {
      hostname: GITHUB_API_URL,
      path: `/repos/${ORG_NAME}/${repo}/contents/${path}`,
      method: "GET",
      headers: headers,
    };

    const fileReq = https.request(fileOptions, (fileRes) => {
      let fileData = "";

      fileRes.on("data", (chunk) => {
        fileData += chunk;
      });

      fileRes.on("end", () => {
        if (fileRes.statusCode === 200) {
          resolve(JSON.parse(fileData).content);
        } else {
          console.log(`No content found for ${repo}/${path}`);
          resolve(null);
        }
      });
    });

    fileReq.on("error", (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(e);
    });

    fileReq.end();
  });
}

function parseDependencies(fileName, fileContent) {
  let dependencies = [];
  const content = Buffer.from(fileContent, "base64").toString("utf-8");
  if (fileName === "package.json") {
    const json = JSON.parse(content);
    dependencies = [
      ...Object.keys(json.dependencies || {}),
      ...Object.keys(json.devDependencies || {}),
    ];
    console.log(`Dependencies found in ${fileName}:`, dependencies);
  }
  // Add parsing logic for other file types here
  return dependencies;
}

function createGraphData(dependencyCount) {
  const nodes = [];
  const links = [];

  Object.keys(dependencyCount).forEach((dep) => {
    nodes.push({ id: dep, count: dependencyCount[dep].count });
    dependencyCount[dep].sources.forEach((source) => {
      links.push({
        source: source,
        target: dep,
        count: dependencyCount[dep].count,
      });
    });
  });

  return { nodes, links };
}

function saveDependencies(graphData) {
  const filePath = "dependencies.json";
  fs.writeFileSync(filePath, JSON.stringify(graphData, null, 2), "utf-8");
  console.log(`Dependencies saved to ${filePath}`);
}
