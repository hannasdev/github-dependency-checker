require("dotenv").config();
const https = require("https");
const { asyncErrorHandler } = require("./errorHandler");
const logger = require("./logger");
const { GITHUB_API_URL, ORG_NAME, TOKEN } = require("./config");

logger.log("ORG_NAME:", ORG_NAME);
logger.log("TOKEN:", TOKEN ? "Loaded" : "Not Loaded");
logger.log("TOKEN Length:", TOKEN.length);

const options = {
  hostname: GITHUB_API_URL,
  path: `/orgs/${ORG_NAME}/repos?per_page=100`,
  method: "GET",
  headers: {
    Authorization: `token ${TOKEN}`,
    "User-Agent": "Node.js",
    Accept: "application/vnd.github.v3+json",
  },
};

async function testHttps() {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      logger.info(`Status Code: ${res.statusCode}`);

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          logger.info("Connection successful:", JSON.parse(data));
          resolve(data);
        } else {
          logger.error("Error:", JSON.parse(data));
          reject(new Error(`HTTP Status Code: ${res.statusCode}`));
        }
      });
    });

    req.on("error", (e) => {
      logger.error(`Problem with request: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

const asyncTestHttps = asyncErrorHandler(testHttps);

if (require.main === module) {
  asyncTestHttps();
}

module.exports = { testHttps: asyncTestHttps };
