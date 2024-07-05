const fs = require("fs").promises;
const { saveDependencies } = require("../src/fileUtils");

jest.mock("winston");
jest.mock("fs", () => ({
  promises: {
    writeFile: jest.fn(),
  },
}));

describe("FileUtils module", () => {
  test("saveDependencies writes correct data to file", () => {
    const graphData = { nodes: [], links: [] };
    saveDependencies(graphData);

    expect(fs.writeFile).toHaveBeenCalledWith(
      "../dependencies.json",
      JSON.stringify(graphData, null, 2),
      "utf-8"
    );
  });
});
