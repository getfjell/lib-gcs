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
    // Allow more parameters for internal operation functions and factory methods
    files: ["src/**/*.ts"],
    rules: {
      "max-params": "off", // Disabled for GCS library due to complex operation signatures
    },
  },
];

