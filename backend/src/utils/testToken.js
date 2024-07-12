import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.TOKEN;

async function testGitHubToken() {
  try {
    const response = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    console.log("Token is valid. Authenticated as:", response.data.login);
    console.log("Token scopes:", response.headers["x-oauth-scopes"]);
  } catch (error) {
    console.error(
      "Error testing token:",
      error.response ? error.response.data : error.message
    );
  }
}

testGitHubToken();
