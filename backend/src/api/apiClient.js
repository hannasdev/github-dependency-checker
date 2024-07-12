import axios from "axios";
import { GITHUB_API_URL, GITHUB_TOKEN, ORG_NAME } from "../config.js";

const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 64000; // 64 seconds
const MAX_RETRIES = 8;

export function createApiClient(logger) {
  const axiosInstance = axios.create({
    baseURL: GITHUB_API_URL,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "User-Agent": "Node.js",
      Accept: "application/vnd.github.v3+json",
    },
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;
      if (!config || !response) return Promise.reject(error);

      if (response.status === 403 || response.status === 429) {
        config.retryCount = config.retryCount || 0;

        if (config.retryCount >= MAX_RETRIES) {
          return Promise.reject(
            new Error(`Max retries (${MAX_RETRIES}) reached for API request`)
          );
        }

        config.retryCount += 1;

        const backoff = Math.min(
          INITIAL_BACKOFF * 2 ** config.retryCount,
          MAX_BACKOFF
        );
        logger.info(`Rate limit hit. Retrying in ${backoff / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));

        return axiosInstance(config);
      }

      return Promise.reject(error);
    }
  );

  return {
    getOrgRepos: async (page = 1, per_page = 100) => {
      const response = await axiosInstance.get(`/orgs/${ORG_NAME}/repos`, {
        params: { page, per_page },
      });
      return response.data;
    },
    getRepoFileContent: async (repo, filePath) => {
      const response = await axiosInstance.get(
        `/repos/${ORG_NAME}/${repo}/contents/${filePath}`
      );
      return response.data;
    },
    getRepoDirectoryContents: async (repo, dirPath) => {
      const response = await axiosInstance.get(
        `/repos/${ORG_NAME}/${repo}/contents/${dirPath}`
      );
      return response.data;
    },
  };
}
