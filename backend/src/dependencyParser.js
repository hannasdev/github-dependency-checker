const ProgressBar = require("progress");

const { getFileContent: asyncGetFileContent } = require("./api");
const { asyncErrorHandler } = require("./errorHandler");

// Parse dependencies from file content
function parseDependencies(fileName, fileContent) {
  const content = Buffer.from(fileContent, "base64").toString("utf-8");
  let dependencies = [];

  switch (fileName) {
    case "package.json":
      const json = JSON.parse(content);
      dependencies = [
        ...Object.keys(json.dependencies || {}),
        ...Object.keys(json.devDependencies || {}),
      ];
      break;

    case "requirements.txt":
      dependencies = content
        .split("\n")
        .filter(Boolean)
        .map((dep) => dep.split("==")[0]);
      break;

    case "Gemfile":
      dependencies = content
        .split("\n")
        .filter((line) => line.startsWith("gem "))
        .map((line) => line.split(" ")[1].replace(/['",]/g, ""));
      break;

    case "pom.xml":
      const regex =
        /<dependency>[\s\S]*?<groupId>(.*?)<\/groupId>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?<\/dependency>/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        dependencies.push(`${match[1]}:${match[2]}`);
      }
      break;
  }

  return dependencies;
}

// Process each repository to get dependencies
async function processRepos(repos) {
  const repoDependencies = {};
  const dependencyFiles = [
    "package.json",
    "requirements.txt",
    "Gemfile",
    "pom.xml",
  ];

  const bar = new ProgressBar("Processing repositories [:bar] :percent :etas", {
    complete: "=",
    incomplete: " ",
    width: 20,
    total: repos.length,
  });

  await Promise.all(
    repos.map(async (repo) => {
      const repoName = repo.name;
      repoDependencies[repoName] = [];

      await Promise.all(
        dependencyFiles.map(async (file) => {
          try {
            const fileContent = await asyncGetFileContent(repoName, file);
            if (fileContent) {
              const deps = await parseDependencies(file, fileContent);
              repoDependencies[repoName].push(...deps);
            }
          } catch (error) {
            console.error(`Error processing ${file} for ${repoName}:`, error);
          }
        })
      );

      bar.tick();
    })
  );

  return repoDependencies;
}

const asyncProcessRepos = asyncErrorHandler(processRepos);

module.exports = {
  processRepos: asyncProcessRepos,
  parseDependencies,
};
