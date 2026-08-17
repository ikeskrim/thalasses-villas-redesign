import coreWebVitals from "eslint-config-next/core-web-vitals";
import next from "eslint-config-next";
import typescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

/** eslint-config-next 16 ships flat configs, so no FlatCompat shim is needed. */
const eslintConfig = [
  ...[next, coreWebVitals, typescript].flat(),
  prettier,
  {
    // eslint-plugin-react's auto-detection calls a removed ESLint 9 context API
    // and throws under ESLint 10. Declaring the version skips that code path.
    settings: { react: { version: "19.2" } },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "content/raw/**",
      "content/raw-js/**",
      "content/raw-ajax/**",
      "content/raw-booking/**",
      "content/text/**",
      "content/extracted-js/**",
      "content/assets/**",
      "public/**",
    ],
  },
];

export default eslintConfig;
