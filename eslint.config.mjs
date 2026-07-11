// ESLint flat config (ESLint 10). `eslint-config-next` ships a native flat
// config array; `core-web-vitals` includes the base Next rules, the TypeScript
// config, and the Core Web Vitals rules.
import next from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "atlas-linkedin-import/**"],
  },
];

export default eslintConfig;
