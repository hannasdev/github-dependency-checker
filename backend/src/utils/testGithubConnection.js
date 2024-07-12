import axios from "axios";
import { TOKEN } from "./config.js";

async function testGitHubConnection() {
  try {
    const response = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    console.log("Connection successful!");
    console.log("Authenticated as:", response.data.login);
  } catch (error) {
    console.error("Error connecting to GitHub API:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testGitHubConnection();
