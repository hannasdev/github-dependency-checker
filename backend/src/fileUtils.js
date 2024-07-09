import { promises as fs } from "fs";
import { asyncErrorHandler } from "./errorHandler.js";
import logger from "./logger.js";

async function saveDependencies(graphData) {
  const filePath = "../../shared/data/dependencies.json";
  try {
    logger.info("Attempting to save dependencies...");
    logger.info("Graph data:", JSON.stringify(graphData));

    await fs.writeFile(filePath, JSON.stringify(graphData, null, 2), {
      encoding: "utf-8",
    });
    logger.info(`Dependencies saved to ${filePath}`);
  } catch (err) {
    logger.error("Error in saveDependencies:", err);
    throw new Error(`Failed to save dependencies: ${err.message}`);
  }
}

export const asyncSaveDependencies = asyncErrorHandler(saveDependencies);
export { saveDependencies }; // Unwrapped version for testing
