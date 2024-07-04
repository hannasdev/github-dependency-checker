const fs = require("fs").promises;

// Save dependencies to a file
async function saveDependencies(graphData) {
  const filePath = "dependencies.json";
  return new Promise((resolve, reject) => {
    fs.writeFile(
      filePath,
      JSON.stringify(graphData, null, 2),
      "utf-8",
      (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Dependencies saved to ${filePath}`);
          resolve();
        }
      }
    );
  });
}

module.exports = { saveDependencies };
