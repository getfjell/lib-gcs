import libraryConfig from "@fjell/eslint-config/library";

export default [
  ...libraryConfig,
  {
    // Relax undefined rule for tests
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    rules: {
      "no-undefined": "off",
    },
  },
  {
    // Allow more parameters for internal operation functions
    files: ["src/ops/**/*.ts"],
    rules: {
      "max-params": ["warn", 10],
    },
  },
];

