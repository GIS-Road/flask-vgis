// eslint.config.js —— Vue3 + Vite + TypeScript 版
// 分工：ESLint 管代码质量；排版统一交给 Prettier（通过 prettier/prettier 规则暴露，可一键修复）
import eslint from '@eslint/js'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier' // 关闭 ESLint 中与 Prettier 冲突的排版规则
import prettier from 'eslint-plugin-prettier' // 让 Prettier 以 ESLint 规则的形式运行

export default typescriptEslint.config(
  // ① 忽略清单
  { ignores: ['node_modules', 'dist', 'public', '*.d.ts'] },

  // ② 核心：规则集合并（作用在 .ts 和 .vue 上）
  {
    files: ['**/*.{ts,vue}'],
    extends: [
      eslint.configs.recommended, // JS 基础规则
      ...typescriptEslint.configs.recommended, // TS 规则
      ...eslintPluginVue.configs['flat/recommended'], // Vue3 规则
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: {
        parser: typescriptEslint.parser, // 内层解析器换成 TS，处理 .vue 里的 <script lang="ts">
      },
    },
    plugins: {
      prettier, // ③ 注册 prettier 插件
    },
    rules: {
      // —— TS 质量类 ——
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }, // _ 开头不报
      ],
      // —— Vue 质量类 ——
      'vue/multi-word-component-names': 'off',
      'vue/valid-define-props': 'off',
      'vue/no-v-model-argument': 'off',
      'prefer-rest-params': 'off',
      // 该规则会与 Prettier 的换行策略打架，且不在 eslint-config-prettier 的关闭清单里，手动关掉
      'vue/first-attribute-linebreak': 'off',
      // —— 通用质量类 ——
      'no-debugger': 2,
      'one-var': ['error', { var: 'never', let: 'never', const: 'never' }],
      // —— 排版统一交给 Prettier（缩进/引号/分号/换行/标签换行等全部由它管）——
      'prettier/prettier': 'error',
    },
  },

  // ④ 关闭与 Prettier 冲突的 ESLint 内置排版规则（必须放数组最后）
  eslintConfigPrettier,
)
