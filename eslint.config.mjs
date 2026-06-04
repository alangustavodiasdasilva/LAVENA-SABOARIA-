import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Permite `any` em estados de listas e payloads dinâmicos do admin
      "@typescript-eslint/no-explicit-any": "off",
      // setState em useEffect é caso válido pra carregar localStorage, URL params, etc.
      "react-hooks/set-state-in-effect": "off",
      // Variáveis com prefixo `_` são intencionalmente ignoradas
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
