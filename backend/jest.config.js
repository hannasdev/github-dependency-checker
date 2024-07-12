export default {
  transform: {},
  extensionsToTreatAsEsm: [],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  transformIgnorePatterns: ["/node_modules/"],
  moduleFileExtensions: [
    "js",
    "mjs",
    "cjs",
    "jsx",
    "ts",
    "tsx",
    "json",
    "node",
  ],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "node",
};
