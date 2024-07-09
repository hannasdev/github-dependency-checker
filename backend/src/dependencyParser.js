import ProgressBar from "progress";
import path from "path";
import pLimit from "p-limit";
import {
  asyncGetFileContent,
  asyncGetDirectoryContents,
  asyncGetMatchingDirectories,
} from "./api.js";
import { asyncErrorHandler } from "./errorHandler.js";
import logger from "./logger.js";

const MONOREPO_FOLDERS = ["applications", "packages", "services"];
const DEPENDENCY_FILES = [
  "package.json",
  "requirements.txt",
  "Gemfile",
  "pom.xml",
];
const DELAY_MS = 250; // Helps mitigate rate limits.

async function processRepos(repos, maxDepth, concurrency = 2) {
  const repoDependencies = {};
  const limit = pLimit(concurrency);

  const bar = new ProgressBar(
    "Processing repositories [:bar] :current/:total :percent :etas",
    {
      complete: "=",
      incomplete: " ",
      width: 20,
      total: repos.length,
    }
  );

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    try {
      repoDependencies[repo.name] = await limit(() =>
        scanRepository(repo.name, maxDepth)
      );
      bar.tick();
      logger.info(`Processed ${i + 1}/${repos.length} repositories`);

      // Add a delay between repository processing
      if (i < repos.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS)); // 1 second delay
      }
    } catch (error) {
      logger.error(`Error processing repository ${repo.name}:`, error);
      // Tick the progress bar even if there's an error
      bar.tick();
      // Continue with the next repository instead of stopping the entire process
    }
  }

  return repoDependencies;
}

async function scanRepository(repoName, maxDepth = 2) {
  const allDependencies = new Set();

  try {
    const lernaConfig = await asyncGetFileContent(repoName, "lerna.json");

    if (lernaConfig) {
      const config = JSON.parse(
        Buffer.from(lernaConfig, "base64").toString("utf-8")
      );
      const packagePatterns = config.packages || ["packages/*"];

      for (const pattern of packagePatterns) {
        const packageDirs = await asyncGetMatchingDirectories(
          repoName,
          pattern
        );
        for (const dir of packageDirs) {
          for (const file of DEPENDENCY_FILES) {
            const filePath = path.join(dir, file);
            const dependencies = await scanDependencyFile(repoName, filePath);
            dependencies.forEach((dep) => allDependencies.add(dep));
          }
        }
      }
    } else {
      await fallbackScan(repoName, maxDepth, allDependencies);
    }
  } catch (error) {
    logger.error(`Error scanning Lerna config for ${repoName}:`, error);
    await fallbackScan(repoName, maxDepth, allDependencies);
  }

  return Array.from(allDependencies);
}

async function fallbackScan(repoName, maxDepth, allDependencies) {
  await Promise.all(
    DEPENDENCY_FILES.map(async (file) => {
      const dependencies = await scanDependencyFile(repoName, file);
      dependencies.forEach((dep) => allDependencies.add(dep));
    })
  );

  await Promise.all(
    MONOREPO_FOLDERS.map((folder) =>
      scanDirectory(repoName, folder, 1, maxDepth, allDependencies)
    )
  );
}

async function scanDirectory(
  repoName,
  dirPath,
  currentDepth,
  maxDepth,
  allDependencies
) {
  if (currentDepth > maxDepth) return;

  const contents = await asyncGetDirectoryContents(repoName, dirPath);
  if (contents && Array.isArray(contents)) {
    await Promise.all(
      contents.map(async (item) => {
        if (item.type === "dir") {
          const newPath = path.join(dirPath, item.name);
          await Promise.all(
            DEPENDENCY_FILES.map(async (file) => {
              const filePath = path.join(newPath, file);
              const dependencies = await scanDependencyFile(repoName, filePath);
              dependencies.forEach((dep) => allDependencies.add(dep));
            })
          );
          await scanDirectory(
            repoName,
            newPath,
            currentDepth + 1,
            maxDepth,
            allDependencies
          );
        }
      })
    );
  }
}

async function scanDependencyFile(repoName, filePath) {
  try {
    const fileContent = await asyncGetFileContent(repoName, filePath);
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

  switch (path.basename(fileName)) {
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

export const asyncProcessRepos = asyncErrorHandler(processRepos);

export { processRepos, scanRepository, parseDependencies };
