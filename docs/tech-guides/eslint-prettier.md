# ESLint and Prettier Configuration for TypeScript React Projects (2026)

ESLint and Prettier ensure code quality, consistency, and maintainability across the CollabBoard codebase. This guide covers the modern flat config approach for ESLint 9+ with TypeScript and React.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [ESLint Configuration](#eslint-configuration)
- [Prettier Configuration](#prettier-configuration)
- [IDE Integration](#ide-integration)
- [Git Hooks with Husky](#git-hooks-with-husky)
- [Custom Rules for CollabBoard](#custom-rules-for-collabboard)
- [Resources](#resources)

---

## Overview

### ESLint vs Prettier

| Tool | Purpose | What It Does |
|------|---------|--------------|
| ESLint | Code Quality | Catches bugs, enforces best practices |
| Prettier | Code Formatting | Consistent style (spacing, quotes, etc.) |

**Key Principle**: Let ESLint handle logic/quality, let Prettier handle formatting.

### Modern Setup (2026)

- **ESLint 9+**: Flat config (`eslint.config.js`)
- **TypeScript ESLint**: Full type-aware linting
- **Prettier 3+**: Integrated with ESLint via plugin

---

## Installation

### Step 1: Install Dependencies

```bash
npm install --save-dev \
  eslint \
  @eslint/js \
  typescript-eslint \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y \
  prettier \
  eslint-plugin-prettier \
  eslint-config-prettier
```

### Step 2: TypeScript Configuration

Ensure `tsconfig.json` is properly configured:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

---

## ESLint Configuration

### Flat Config (eslint.config.js)

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      prettier,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      'prettier/prettier': 'error',

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.netlify/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
  prettierConfig
);
```

### Package.json Scripts

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\""
  }
}
```

---

## Prettier Configuration

### .prettierrc

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "jsxSingleQuote": false,
  "bracketSameLine": false
}
```

### .prettierignore

```
dist
node_modules
.netlify
coverage
*.min.js
package-lock.json
```

### Alternative: prettier.config.js

```javascript
/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
```

---

## IDE Integration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### VS Code Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Cursor IDE

Cursor uses VS Code settings. The same configuration applies.

---

## Git Hooks with Husky

### Step 1: Install Husky and lint-staged

```bash
npm install --save-dev husky lint-staged
npx husky init
```

### Step 2: Configure lint-staged

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,json,md}": [
      "prettier --write"
    ]
  }
}
```

### Step 3: Create Pre-commit Hook

```bash
echo "npx lint-staged" > .husky/pre-commit
```

### Step 4: Create Pre-push Hook (Optional)

```bash
echo "npm run type-check && npm test" > .husky/pre-push
```

### Full Husky Setup

`.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

`.husky/commit-msg`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
```

### Commitlint Configuration

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

`commitlint.config.js`:

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'ci',
        'build',
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
  },
};
```

---

## Custom Rules for CollabBoard

### No Single-Line Comments Rule

Per project requirements, enforce JSDoc over single-line comments:

```javascript
{
  rules: {
    'no-warning-comments': ['warn', { terms: ['TODO', 'FIXME'], location: 'start' }],
    
    'jsdoc/require-jsdoc': ['error', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
      },
      publicOnly: true,
    }],
  },
}
```

Install jsdoc plugin:

```bash
npm install --save-dev eslint-plugin-jsdoc
```

### React-Specific Rules

```javascript
{
  rules: {
    'react/jsx-no-leaked-render': 'error',
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/self-closing-comp': 'error',
    'react/jsx-sort-props': ['error', {
      callbacksLast: true,
      shorthandFirst: true,
      reservedFirst: true,
    }],
  },
}
```

### Import Organization

```bash
npm install --save-dev eslint-plugin-import
```

```javascript
import importPlugin from 'eslint-plugin-import';

{
  plugins: {
    import: importPlugin,
  },
  rules: {
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
        'type',
      ],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
    }],
    'import/no-duplicates': 'error',
    'import/no-cycle': 'error',
  },
}
```

---

## Common Issues and Solutions

### ESLint + TypeScript Performance

For large projects, use project references:

```json
{
  "compilerOptions": {
    "composite": true
  }
}
```

Or disable type-checked rules for specific files:

```javascript
{
  files: ['**/*.test.ts', '**/*.test.tsx'],
  ...tseslint.configs.disableTypeChecked,
}
```

### Prettier Conflicts

If ESLint and Prettier conflict, ensure `eslint-config-prettier` is last:

```javascript
export default tseslint.config(
  // Other configs...
  prettierConfig  // Must be last!
);
```

### CI Integration

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run type-check
```

---

## Resources

### Official Documentation
- [ESLint Documentation](https://eslint.org/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [Prettier Documentation](https://prettier.io/)

### Tutorials
- [ESLint Flat Config Migration](https://eslint.org/docs/latest/use/configure/migration-guide)
- [Setting Up ESLint and Prettier](https://medium.com/@robinviktorsson/setting-up-eslint-and-prettier-for-a-typescript-project-aa2434417b8f)

### Related CollabBoard Guides
- [React Guide](./react.md) - React best practices
- [Jest/Cypress Guide](./jest-cypress.md) - Testing setup
