import { parseDependencies } from "./dependencyParser.js";
import { handleApiError, handleParsingError } from "./errorHandler.js";

export async function scanDependencyFile(repoName, filePath, dependencies) {
  const { getFileContent, logger } = dependencies;
  try {
    const fileContent = await getFileContent(repoName, filePath);
    if (fileContent) {
      try {
        return parseDependencies(filePath, fileContent);
      } catch (error) {
        handleParsingError(error, logger, "dependencies", filePath);
        return [];
      }
    }
    return [];
  } catch (error) {
    handleApiError(error, logger, `Error scanning ${filePath} in ${repoName}`);
    return [];
  }
}
