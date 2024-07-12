import { makeGitHubRequest } from "../api/apiClient.js";

export async function verifyGitHubToken() {
  try {
    const user = await makeGitHubRequest("get", "/user");
    console.log(`GitHub token verified. Authenticated as: ${user.login}`);
  } catch (error) {
    console.error("Failed to verify GitHub token:", error.message);
    process.exit(1);
  }
}

// Call this function when your application starts
