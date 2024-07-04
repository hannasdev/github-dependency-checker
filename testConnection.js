require("dotenv").config();
const axios = require("axios");
const { asyncErrorHandler, errorHandler } = require("./errorHandler");
const logger = require("./logger");
const { GITHUB_API_URL, ORG_NAME, TOKEN } = require("./config");

console.log("ORG_NAME:", ORG_NAME);
console.log("TOKEN:", TOKEN ? "Loaded" : "Not Loaded");
console.log("TOKEN Length:", TOKEN.length);

const headers = {
  Authorization: `token ${TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

async function testConnection() {
  const url = `${GITHUB_API_URL}/orgs/${ORG_NAME}/repos?per_page=100`;
  try {
    const response = await axios.get(url, { headers });
    logger.info("Connection successful:", response.data);
  } catch (error) {
    logger.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    throw error; // Re-throw the error so it can be caught by asyncErrorHandler
  }
}

const wrappedTestConnection = asyncErrorHandler(testConnection);

if (require.main === module) {
  wrappedTestConnection();
}

module.exports = { testConnection: wrappedTestConnection };
