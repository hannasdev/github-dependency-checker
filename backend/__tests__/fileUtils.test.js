import { jest } from "@jest/globals";

jest.mock("fs/promises", () => ({
  writeFile: jest.fn(),
}));

jest.mock("../src/logger.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import * as fs from "fs/promises";

describe("FileUtils module", () => {
  let saveDependencies;

  beforeEach(async () => {
    jest.clearAllMocks();
    const fileUtils = await import("../src/fileUtils.js");
    saveDependencies = fileUtils.saveDependencies;
  });

  test("saveDependencies writes correct data to file", async () => {
    const graphData = { nodes: [], links: [] };
    fs.writeFile.mockResolvedValue(undefined);

    await saveDependencies(graphData);

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("dependencies.json"),
      JSON.stringify(graphData, null, 2),
      { encoding: "utf-8" }
    );
  });

  test("saveDependencies handles errors", async () => {
    const graphData = { nodes: [], links: [] };
    const error = new Error("Write error");
    fs.writeFile.mockRejectedValue(error);

    await expect(saveDependencies(graphData)).rejects.toThrow(
      "Failed to save dependencies: Write error"
    );
  });
});
