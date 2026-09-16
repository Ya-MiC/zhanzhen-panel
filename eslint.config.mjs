import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";

export default [
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  { ignores: ["**/dist/**", "**/node_modules/**", "deploy/**"] },
  {
    files: ["apps/**/*.{js,mjs,ts,vue}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { window: "readonly", localStorage: "readonly", document: "readonly" } },
    rules: { "vue/multi-word-component-names": "off" },
  },
];
