import https from "https";
import logger from "./logger.js";

const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 64000; // 64 seconds
const MAX_RETRIES = 8;

export async function githubApiRequest(options) {
  let retries = 0;
  let backoff = INITIAL_BACKOFF;

  while (retries <= MAX_RETRIES) {
    try {
      const { data, headers } = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = "";
          res.on("data", (chunk) => {
            responseData += chunk;
          });
          res.on("end", () => {
            if (res.statusCode === 200) {
              resolve({ data: JSON.parse(responseData), headers: res.headers });
            } else if (res.statusCode === 403 || res.statusCode === 429) {
              reject({
                status: res.statusCode,
                headers: res.headers,
                data: responseData,
              });
            } else {
              reject(
                new Error(
                  `GitHub API responded with status code ${res.statusCode}: ${responseData}`
                )
              );
            }
          });
        });

        req.on("error", (e) =>
          reject(new Error(`Request failed: ${e.message}`))
        );
        req.end();
      });

      return data;
    } catch (error) {
      if (error.status === 403 || error.status === 429) {
        const resetTime =
          parseInt(error.headers["x-ratelimit-reset"], 10) * 1000;
        const waitTime = Math.max(resetTime - Date.now(), backoff);

        logger.info(
          `Rate limit hit. Retrying in ${waitTime / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        backoff = Math.min(backoff * 2, MAX_BACKOFF);
        retries++;
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Max retries (${MAX_RETRIES}) reached for API request`);
}
