require("dotenv").config();
const https = require("https");

const GITHUB_API_URL = "api.github.com";
const ORG_NAME = process.env.ORG_NAME;
const TOKEN = process.env.TOKEN;

console.log("ORG_NAME:", ORG_NAME);
console.log("TOKEN:", TOKEN ? "Loaded" : "Not Loaded");
console.log("TOKEN Length:", TOKEN);

const options = {
  hostname: GITHUB_API_URL,
  path: `/orgs/${ORG_NAME}/repos?per_page=100`,
  method: "GET",
  headers: {
    Authorization: `token ${TOKEN}`,
    "User-Agent": "Node.js",
    Accept: "application/vnd.github.v3+json",
  },
};

const req = https.request(options, (res) => {
  let data = "";

  // Log status code for debugging purposes
  console.log(`Status Code: ${res.statusCode}`);

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    if (res.statusCode === 200) {
      console.log("Connection successful:", JSON.parse(data));
    } else {
      console.log("Error:", JSON.parse(data));
    }
  });
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
