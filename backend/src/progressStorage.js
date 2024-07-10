import fs from "fs/promises";
import path from "path";

const PROGRESS_FILE = path.join(process.cwd(), "progress.json");

export class ProgressStorage {
  constructor() {
    this.progress = {};
  }

  async load() {
    try {
      const data = await fs.readFile(PROGRESS_FILE, "utf8");
      this.progress = JSON.parse(data);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Error loading progress:", error);
      }
      // If file doesn't exist or there's an error, start with empty progress
      this.progress = {};
    }
  }

  async save() {
    try {
      await fs.writeFile(PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }

  setRepoProgress(repoName, dependencies) {
    this.progress[repoName] = dependencies;
  }

  getRepoProgress(repoName) {
    return this.progress[repoName];
  }

  getAllProgress() {
    return this.progress;
  }

  async clear() {
    this.progress = {};
    await this.save();
  }
}
