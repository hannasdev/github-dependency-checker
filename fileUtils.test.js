const fs = require("fs");
const { saveDependencies } = require("./fileUtils");

// Mock only the writeFile function of fs.promises
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  promises: {
    writeFile: jest.fn(),
  },
}));

describe("saveDependencies", () => {
  it("should correctly save the dependencies data to a JSON file", async () => {
    const graphData = {
      nodes: [
        { id: "repo1", depth: 0 },
        { id: "repo2", depth: 0 },
        { id: "dep1", count: 1 },
        { id: "dep2", count: 2 },
      ],
      links: [
        { source: "repo1", target: "dep1", count: 1 },
        { source: "repo2", target: "dep2", count: 2 },
      ],
    };

    // Call saveDependencies with the sample graphData
    await saveDependencies(graphData);

    // Validate that fs.promises.writeFile was called with the correct arguments
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      "dependencies.json",
      JSON.stringify(graphData, null, 2),
      "utf-8"
    );

    // Reset the mock
    fs.promises.writeFile.mockReset();
  });
});
