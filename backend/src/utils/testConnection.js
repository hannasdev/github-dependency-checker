import dotenv from "dotenv";
import axios from "axios";
import { asyncErrorHandler } from "./errorHandler.js";
import container from "./dependencyContainer.js";

const { logger } = container.cradle;
import { GITHUB_API_URL, ORG_NAME, TOKEN } from "./config.js";

dotenv.config();

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

export { asyncTestConnection };
