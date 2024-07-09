import https from "https";
import logger from "./logger.js";

const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 64000; // 64 seconds
const MAX_RETRIES = 5;

export async function githubApiRequest(options) {
  let retries = 0;
  let backoff = INITIAL_BACKOFF;

  while (true) {
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
            } else if (res.statusCode === 403) {
              reject({ status: 403, headers: res.headers, data: responseData });
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
      if (error.status === 403) {
        const resetTime =
          parseInt(error.headers["x-ratelimit-reset"], 10) * 1000;
        const waitTime = resetTime - Date.now();

        if (error.data.includes("secondary rate limit")) {
          if (retries >= MAX_RETRIES) {
            throw new Error("Max retries reached for secondary rate limit");
          }
          logger.info(
            `Secondary rate limit hit. Retrying in ${backoff / 1000} seconds...`
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
          backoff = Math.min(backoff * 2, MAX_BACKOFF);
          retries++;
        } else if (waitTime > 0) {
          logger.info(
            `Primary rate limit exceeded. Waiting for ${
              waitTime / 1000
            } seconds...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      } else {
        throw error;
      }
    }
  }
}
