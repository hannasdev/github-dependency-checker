const fs = require("fs").promises;
const { asyncErrorHandler } = require("./errorHandler");
const logger = require("./logger");

async function saveDependencies(graphData) {
  const filePath = "../dependencies.json";
  try {
    logger.info("Attempting to save dependencies...");
    logger.info("Graph data:", JSON.stringify(graphData));

    await fs.writeFile(filePath, JSON.stringify(graphData, null, 2), "utf-8");
    logger.info(`Dependencies saved to ${filePath}`);
  } catch (err) {
    logger.error("Error in saveDependencies:", err);
    throw new Error(`Failed to save dependencies: ${err.message}`);
  }
}
const asyncSaveDependencies = asyncErrorHandler(saveDependencies);

module.exports = {
  saveDependencies, // Unwrapped version for testing
  asyncSaveDependencies, // Wrapped version for production use
};
