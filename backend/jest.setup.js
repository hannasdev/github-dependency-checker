import { jest } from "@jest/globals";
import { LOG_LEVEL } from "./src/config";

// jest.setup.js
jest.mock("./src/config.js", () => ({
  CACHE_DIR: "mock-cache-dir",
  DEPENDENCY_FILES: ["package.json", "requirements.txt", "Gemfile", "pom.xml"],
  GITHUB_API_URL: "https://api.github.com",
  GITHUB_TOKEN: "test-token",
  INTERNAL_REPO_IDENTIFIER: "@mock-org/",
  LIMIT: 10,
  LOG_LEVEL: "info",
  MONOREPO_FOLDERS: ["applications", "packages", "services"],
  ORG_NAME: "test-org",
}));
