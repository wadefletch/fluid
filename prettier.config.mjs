export default {
  plugins: [
    "@prettier/plugin-oxc",
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-packagejson",
  ],
  overrides: [
    {
      files: ["**/*.{js,mjs,cjs,jsx}"],
      options: {
        plugins: ["@prettier/plugin-oxc"],
        parser: "oxc",
      },
    },
    {
      files: ["**/*.{ts,mts,cts,tsx}"],
      options: {
        plugins: ["@prettier/plugin-oxc"],
        parser: "oxc-ts",
      },
    },
  ],
};
