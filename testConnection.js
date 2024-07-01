require("dotenv").config();
const axios = require("axios");

const GITHUB_API_URL = "https://api.github.com";
const ORG_NAME = process.env.ORG_NAME;
const TOKEN = process.env.TOKEN;

console.log("ORG_NAME:", ORG_NAME);
console.log("TOKEN:", TOKEN ? "Loaded" : "Not Loaded");
console.log("TOKEN Length:", TOKEN.length);
console.log("Full TOKEN:", `"Authorization": "token ${TOKEN}"`);

const headers = {
  Authorization: `token ${TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

async function testConnection() {
  const url = `${GITHUB_API_URL}/orgs/${ORG_NAME}/repos?per_page=100`;
  try {
    const response = await axios.get(url, { headers });
    console.log("Connection successful:", response.data);
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

testConnection().catch((error) => console.error(error));
