import path from "path";
import { minimatch } from "minimatch";
import { MONOREPO_FOLDERS, DEPENDENCY_FILES } from "./config.js";
import { scanDependencyFile } from "./fileScanner.js";
import {
  handleFileSystemError,
  handleParsingError,
  handleUnexpectedError,
} from "./errorHandler.js";

export async function scanRepository(repoName, maxDepth = 2, dependencies) {
  const { logger, getFileContent, getDirectoryContents } = dependencies;
  const allDependencies = new Set();

  try {
    const lernaConfig = await getFileContent(repoName, "lerna.json");

    if (lernaConfig) {
      try {
        const config = JSON.parse(
          Buffer.from(lernaConfig, "base64").toString("utf-8")
        );
        const packagePatterns = config.packages || ["packages/*"];

        for (const pattern of packagePatterns) {
          const packageDirs = await getMatchingDirectories(
            repoName,
            pattern,
            dependencies
          );
          for (const dir of packageDirs) {
            for (const file of DEPENDENCY_FILES) {
              const filePath = path.join(dir, file);
              try {
                const deps = await scanDependencyFile(
                  repoName,
                  filePath,
                  dependencies
                );
                deps.forEach((dep) => allDependencies.add(dep));
              } catch (error) {
                handleFileSystemError(error, logger, "read", filePath);
              }
            }
          }
        }
      } catch (error) {
        handleParsingError(error, logger, "JSON", "lerna.json");
      }
    } else {
      await fallbackScan(repoName, maxDepth, allDependencies, dependencies);
    }
  } catch (error) {
    handleUnexpectedError(
      error,
      logger,
      `Error scanning Lerna config for ${repoName}`
    );
    await fallbackScan(repoName, maxDepth, allDependencies, dependencies);
  }

  return Array.from(allDependencies);
}

async function fallbackScan(repoName, maxDepth, allDependencies, dependencies) {
  const { logger } = dependencies;
  try {
    await Promise.all(
      DEPENDENCY_FILES.map(async (file) => {
        try {
          const deps = await scanDependencyFile(repoName, file, dependencies);
          deps.forEach((dep) => allDependencies.add(dep));
        } catch (error) {
          handleFileSystemError(error, logger, "read", file);
        }
      })
    );

    await Promise.all(
      MONOREPO_FOLDERS.map((folder) =>
        scanDirectory(
          repoName,
          folder,
          1,
          maxDepth,
          allDependencies,
          dependencies
        )
      )
    );
  } catch (error) {
    handleUnexpectedError(
      error,
      logger,
      `Error during fallback scan for ${repoName}`
    );
  }
}

async function scanDirectory(
  repoName,
  dirPath,
  currentDepth,
  maxDepth,
  allDependencies,
  dependencies
) {
  const { logger, getDirectoryContents } = dependencies;
  if (currentDepth > maxDepth) return;

  try {
    const contents = await getDirectoryContents(repoName, dirPath);
    if (contents && Array.isArray(contents)) {
      await Promise.all(
        contents.map(async (item) => {
          if (item.type === "dir") {
            const newPath = path.join(dirPath, item.name);
            await Promise.all(
              DEPENDENCY_FILES.map(async (file) => {
                const filePath = path.join(newPath, file);
                try {
                  const deps = await scanDependencyFile(
                    repoName,
                    filePath,
                    dependencies
                  );
                  deps.forEach((dep) => allDependencies.add(dep));
                } catch (error) {
                  handleFileSystemError(error, logger, "read", filePath);
                }
              })
            );
            await scanDirectory(
              repoName,
              newPath,
              currentDepth + 1,
              maxDepth,
              allDependencies,
              dependencies
            );
          }
        })
      );
    }
  } catch (error) {
    handleUnexpectedError(
      error,
      logger,
      `Error scanning directory ${dirPath} in ${repoName}`
    );
  }
}

async function getMatchingDirectories(repoName, pattern, dependencies) {
  const { getDirectoryContents } = dependencies;
  const matchingDirs = [];

  async function traverse(currentPath = "") {
    try {
      const contents = await getDirectoryContents(repoName, currentPath);

      if (!contents || !Array.isArray(contents)) return;

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
      // Handle or log the error as appropriate
      console.error(`Error traversing ${currentPath} in ${repoName}:`, error);
    }
  }

  await traverse();
  return matchingDirs;
}
