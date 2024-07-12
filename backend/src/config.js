import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const GITHUB_API_URL = "https://api.github.com";
export const ORG_NAME = process.env.ORG_NAME;
export const GITHUB_TOKEN = process.env.TOKEN;
export const LIMIT = parseInt(process.env.REPO_LIMIT || "10", 10);
export const INTERNAL_REPO_IDENTIFIER =
  process.env.REPO_IDENTIFIER || "@your-org/";
export const CACHE_DIR = path.join(__dirname, "..", ".cache");
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";

export const DEPENDENCY_FILES = [
  "package.json",
  "requirements.txt",
  "Gemfile",
  "pom.xml",
];

export const MONOREPO_FOLDERS = ["applications", "packages", "services"];

if (!GITHUB_TOKEN) {
  console.error(
    "GitHub token is not set. Please check your .env file.",
    process.env
  );
  process.exit(1);
}

if (!ORG_NAME) {
  console.error(
    "Organization name is not set. Please check your .env file.",
    process.env
  );
  process.exit(1);
}

export { __dirname };
