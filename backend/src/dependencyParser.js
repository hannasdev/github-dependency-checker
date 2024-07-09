const ProgressBar = require("progress");
const { getFileContent, getDirectoryContents } = require("./api");
const { asyncErrorHandler } = require("./errorHandler");
const logger = require("./logger");

const MONOREPO_FOLDERS = ["applications", "packages", "services"];
const DEPENDENCY_FILES = [
  "package.json",
  "requirements.txt",
  "Gemfile",
  "pom.xml",
];

async function processRepos(repos) {
  const repoDependencies = {};
  const bar = new ProgressBar("Processing repositories [:bar] :percent :etas", {
    complete: "=",
    incomplete: " ",
    width: 20,
    total: repos.length,
  });

  for (const repo of repos) {
    repoDependencies[repo.name] = await scanRepository(repo.name);
    bar.tick();
  }

  return repoDependencies;
}

async function scanRepository(repoName) {
  const allDependencies = [];

  // Scan root level
  for (const file of DEPENDENCY_FILES) {
    const dependencies = await scanDependencyFile(repoName, file);
    allDependencies.push(...dependencies);
  }

  // Scan potential monorepo folders
  for (const folder of MONOREPO_FOLDERS) {
    const contents = await getDirectoryContents(repoName, folder);
    if (contents && Array.isArray(contents)) {
      for (const item of contents) {
        if (item.type === "dir") {
          for (const file of DEPENDENCY_FILES) {
            const path = `${folder}/${item.name}/${file}`;
            const dependencies = await scanDependencyFile(repoName, path);
            allDependencies.push(...dependencies);
          }
        }
      }
    }
  }

  return [...new Set(allDependencies)]; // Remove duplicates
}

async function scanDependencyFile(repoName, filePath) {
  try {
    const fileContent = await getFileContent(repoName, filePath);
    if (fileContent) {
      return parseDependencies(filePath, fileContent);
    }
  } catch (error) {
    logger.error(`Error scanning ${filePath} in ${repoName}:`, error);
  }
  return [];
}

function parseDependencies(fileName, fileContent) {
  const content = Buffer.from(fileContent, "base64").toString("utf-8");
  let dependencies = [];

  switch (fileName.split("/").pop()) {
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
        .map((dep) => dep.split("==")[0].trim());
      break;

    case "Gemfile":
      dependencies = content
        .split("\n")
        .filter((line) => line.trim().startsWith("gem "))
        .map((line) => line.split(" ")[1].replace(/['",]/g, "").trim());
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

const asyncProcessRepos = asyncErrorHandler(processRepos);

module.exports = {
  processRepos: asyncProcessRepos,
  scanRepository,
  parseDependencies,
};
