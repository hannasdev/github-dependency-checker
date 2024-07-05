require("dotenv").config();
const axios = require("axios");
const { asyncErrorHandler } = require("./errorHandler");
const logger = require("./logger");
const { GITHUB_API_URL, ORG_NAME, TOKEN } = require("./config");

logger.log("ORG_NAME:", ORG_NAME);
logger.log("TOKEN:", TOKEN ? "Loaded" : "Not Loaded");
logger.log("TOKEN Length:", TOKEN.length);

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

const asyncTestConnection = asyncErrorHandler(testConnection);

if (require.main === module) {
  asyncTestConnection();
}

module.exports = { testConnection: asyncTestConnection };
