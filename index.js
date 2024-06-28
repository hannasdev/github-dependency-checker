const axios = require("axios");
require("dotenv").config();

const GITHUB_API_URL = "https://api.github.com";
const ORG_NAME = process.env.ORG_NAME;
const TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  Authorization: `token ${TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

const dependencyFiles = [
  "package.json",
  "requirements.txt",
  "Gemfile",
  "pom.xml",
];

async function getRepos(org) {
  let url = `${GITHUB_API_URL}/orgs/${org}/repos?per_page=100`;
  const repos = [];
  while (url) {
    const response = await axios.get(url, { headers });
    repos.push(...response.data);
    url =
      response.headers.link && response.headers.link.includes('rel="next"')
        ? response.headers.link.split(";")[0].replace("<", "").replace(">", "")
        : null;
  }
  return repos;
}

async function getFileContent(repo, path) {
  try {
    const url = `${GITHUB_API_URL}/repos/${ORG_NAME}/${repo}/contents/${path}`;
    const response = await axios.get(url, { headers });
    return response.data.content;
  } catch (error) {
    return null;
  }
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
  }
  // Add parsing logic for other file types here
  return dependencies;
}

async function main() {
  const repos = await getRepos(ORG_NAME);
  const repoDependencies = {};

  for (const repo of repos) {
    const repoName = repo.name;
    repoDependencies[repoName] = [];

    for (const file of dependencyFiles) {
      const content = await getFileContent(repoName, file);
      if (content) {
        const deps = parseDependencies(file, content);
        repoDependencies[repoName].push(...deps);
      }
    }
  }

  // Identify internal dependencies
  const internalRepos = repos.map((repo) => repo.name);
  const internalDependencies = {};

  for (const [repo, deps] of Object.entries(repoDependencies)) {
    internalDependencies[repo] = deps.filter((dep) =>
      internalRepos.includes(dep)
    );
  }

  console.log("Internal Dependencies:", internalDependencies);
}

main().catch((error) => console.error(error));
