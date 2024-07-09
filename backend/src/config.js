import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export const GITHUB_API_URL = "api.github.com";
export const ORG_NAME = process.env.ORG_NAME;
export const TOKEN = process.env.TOKEN;
export const LIMIT = 10;
export const INTERNAL_REPO_IDENTIFIER = process.env.REPO_IDENTIFIER;
export const CACHE_DIR = path.join(__dirname, "..", ".cache");

// If you need to use __dirname in other parts of your code, you can export it
export { __dirname };
