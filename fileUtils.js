const fs = require("fs").promises;
const { asyncErrorHandler } = require("./errorHandler");

async function saveDependencies(graphData) {
  const filePath = "dependencies.json";
  try {
    console.log("Attempting to save dependencies..."); // Add this line
    console.log("Graph data:", JSON.stringify(graphData)); // Add this line
    await fs.writeFile(filePath, JSON.stringify(graphData, null, 2), "utf-8");
    console.log(`Dependencies saved to ${filePath}`);
  } catch (err) {
    console.error("Error in saveDependencies:", err); // Add this line
    throw new Error(`Failed to save dependencies: ${err.message}`);
  }
}
const asyncSaveDependencies = asyncErrorHandler(saveDependencies);

module.exports = {
  saveDependencies, // Unwrapped version for testing
  asyncSaveDependencies, // Wrapped version for production use
};
