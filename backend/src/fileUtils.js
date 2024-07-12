import { promises as fs } from "fs";
import path from "path";
import { handleFileSystemError } from "./errorHandler.js";

export async function saveDependencies(graphData, logger) {
  const filePath = path.join(
    process.cwd(),
    "..",
    "shared",
    "data",
    "dependencies.json"
  );
  try {
    logger.info("Attempting to save dependencies...");
    logger.info("Graph data:", JSON.stringify(graphData));

    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    await fs.writeFile(filePath, JSON.stringify(graphData, null, 2), {
      encoding: "utf-8",
    });
    logger.info(`Dependencies saved to ${filePath}`);
  } catch (err) {
    handleFileSystemError(err, logger, "write", filePath);
  }
}
