import path from "path";
import { handleParsingError } from "./errorHandler.js";

export function parseDependencies(fileName, fileContent, logger) {
  const content = Buffer.from(fileContent, "base64").toString("utf-8");
  let dependencies = [];

  try {
    switch (path.basename(fileName)) {
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
          .map((dep) => dep.split("==")[0].trim());
        break;

      case "Gemfile":
        dependencies = content
          .split("\n")
          .filter((line) => line.trim().startsWith("gem "))
          .map((line) => line.split(" ")[1].replace(/['",]/g, "").trim());
        break;

      case "pom.xml":
        const regex =
          /<dependency>[\s\S]*?<groupId>(.*?)<\/groupId>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?<\/dependency>/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          dependencies.push(`${match[1]}:${match[2]}`);
        }
        break;

      default:
        logger.warn(`Unsupported file type: ${fileName}`);
    }
  } catch (error) {
    handleParsingError(error, logger, path.basename(fileName), fileName);
  }

  return dependencies;
}
