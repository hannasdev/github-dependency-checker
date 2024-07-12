import axios from "axios";

const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 64000; // 64 seconds
const MAX_RETRIES = 8;

export function createApiClient(logger, axiosInstance = null, config) {
  if (!axiosInstance) {
    axiosInstance = axios.create({
      baseURL: config.GITHUB_API_URL,
      headers: {
        Authorization: `token ${config.GITHUB_TOKEN}`,
        "User-Agent": "Node.js",
        Accept: "application/vnd.github.v3+json",
      },
    });
  }

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config: errorConfig, response } = error;
      if (!errorConfig || !response) return Promise.reject(error);

      if (response.status === 403 || response.status === 429) {
        errorConfig.retryCount = errorConfig.retryCount || 0;

        if (errorConfig.retryCount >= MAX_RETRIES) {
          return Promise.reject(
            new Error(`Max retries (${MAX_RETRIES}) reached for API request`)
          );
        }

        errorConfig.retryCount += 1;

        const backoff = Math.min(
          INITIAL_BACKOFF * 2 ** errorConfig.retryCount,
          MAX_BACKOFF
        );
        logger.info(`Rate limit hit. Retrying in ${backoff / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));

        return axiosInstance(errorConfig);
      }

      return Promise.reject(error);
    }
  );

  // Capture config in closure
  return {
    async getOrgRepos(page = 1, per_page = 100) {
      const response = await axiosInstance.get(
        `/orgs/${config.ORG_NAME}/repos`,
        {
          params: { page, per_page },
        }
      );
      return response.data;
    },

    async getRepoFileContent(repo, filePath) {
      const response = await axiosInstance.get(
        `/repos/${config.ORG_NAME}/${repo}/contents/${filePath}`
      );
      return response.data;
    },

    async getRepoDirectoryContents(repo, dirPath) {
      const response = await axiosInstance.get(
        `/repos/${config.ORG_NAME}/${repo}/contents/${dirPath}`
      );
      return response.data;
    },
  };
}
