import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'
import tsEslintParser from '@typescript-eslint/parser'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import reactPlugin from 'eslint-plugin-react'
import pluginQuery from '@tanstack/eslint-plugin-query'
import unusedImports from 'eslint-plugin-unused-imports'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.react-router', 'build'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      jsxA11y.flatConfigs.recommended,
      importPlugin.flatConfigs.recommended,
      eslintPluginUnicorn.configs.recommended,
      eslintConfigPrettier,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsEslintParser,
    },
    plugins: {
      'react-hooks': reactHooks,
      react: reactPlugin,
      '@tanstack/query': pluginQuery,
      'unused-imports': unusedImports,
    },
    settings: {
      'import/internal-regex': '^~/',
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      '@tanstack/query/exhaustive-deps': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: ['App'],
        },
      ],
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-useless-promise-resolve-reject': 'off',
      'unicorn/no-null': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'no-console': 'error',
      'no-empty-pattern': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '~/components/*/*/*',
                '~/apis/*/*/*',
                '~/lib/*/*/*',
                '../*',
              ],
            },
          ],
        },
      ],
      'linebreak-style': ['error', 'unix'],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-named-as-default': 'off',
      'import/no-unresolved': [
        'error',
        {
          ignore: [
            '\\.(png|svg|jpg|jpeg|gif|webp|ico|bmp|tiff|mp4|mp3|woff|woff2|eot|ttf|otf)$',
          ],
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/jsx-key': [
        'error',
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true,
          warnOnDuplicates: true,
        },
      ],
    },
  },
)
