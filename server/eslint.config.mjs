import globals from "globals";
import js from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    files: ["src/**/*.js", "test/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "commonjs",
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_[a-zA-Z]", "varsIgnorePattern": "^_[a-zA-Z]", "caughtErrorsIgnorePattern": "^_[a-zA-Z]" }],
    },
  },
  {
    files: ["web/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      ecmaVersion: "latest",
      sourceType: "script",
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_[a-zA-Z]", "varsIgnorePattern": "^_[a-zA-Z]" }],
    },
  },
  {
    files: ["**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
  },
];
