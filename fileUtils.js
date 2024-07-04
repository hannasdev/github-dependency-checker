const fs = require("fs").promises;
const { asyncErrorHandler } = require("./errorHandler");

async function saveDependencies(graphData) {
  const filePath = "dependencies.json";
  try {
    await fs.writeFile(filePath, JSON.stringify(graphData, null, 2), "utf-8");
    console.log(`Dependencies saved to ${filePath}`);
  } catch (err) {
    throw new Error(`Failed to save dependencies: ${err.message}`);
  }
}

const wrappedSaveDependencies = asyncErrorHandler(saveDependencies);

module.exports = {
  saveDependencies, // Unwrapped version for testing
  wrappedSaveDependencies, // Wrapped version for production use
};
