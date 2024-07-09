import {
  calculateNodeSize,
  getNodeColor,
  getLinkStrength,
} from "../src/utils/graphUtils";

// Mock D3 color scale
const mockColorScale = jest.fn((group) => `color-${group}`);

jest.mock("d3", () => ({
  scaleOrdinal: jest.fn(() => mockColorScale),
  schemeCategory10: ["color1", "color2", "color3"], // mock color scheme
}));

describe("Graph Utility Functions", () => {
  describe("calculateNodeSize", () => {
    test("calculates size based on weight", () => {
      expect(calculateNodeSize({ weight: 2 })).toBe(9);
      expect(calculateNodeSize({ weight: 5 })).toBe(15);
    });

    test("uses default weight of 1 if not provided", () => {
      expect(calculateNodeSize({})).toBe(7);
    });
  });

  describe("getNodeColor", () => {
    test("returns color based on node group", () => {
      const node1 = { group: 1 };
      const node2 = { group: 2 };
      expect(getNodeColor(node1, mockColorScale)).toBe("color-1");
      expect(getNodeColor(node2, mockColorScale)).toBe("color-2");
      expect(getNodeColor(node1, mockColorScale)).not.toBe(
        getNodeColor(node2, mockColorScale)
      );
    });

    test("returns same color for same group", () => {
      const node1 = { group: 1 };
      const node2 = { group: 1 };
      expect(getNodeColor(node1, mockColorScale)).toBe(
        getNodeColor(node2, mockColorScale)
      );
    });
  });

  describe("getLinkStrength", () => {
    test("calculates strength based on value", () => {
      expect(getLinkStrength({ value: 2 })).toBe(0.5);
      expect(getLinkStrength({ value: 4 })).toBe(0.25);
    });

    test("uses default value of 1 if not provided", () => {
      expect(getLinkStrength({})).toBe(1);
    });
  });
});
