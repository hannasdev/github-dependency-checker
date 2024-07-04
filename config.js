const path = require("path");
require("dotenv").config();

module.exports = {
  GITHUB_API_URL: "api.github.com",
  ORG_NAME: process.env.ORG_NAME,
  TOKEN: process.env.TOKEN,
  LIMIT: 10,
  INTERNAL_REPO_IDENTIFIER: process.env.REPO_IDENTIFIER,
  CACHE_DIR: path.join(__dirname, ".cache"),
};
