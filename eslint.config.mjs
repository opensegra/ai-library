import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['../*'], message: 'Import through @/ instead of a relative parent path.' }] }
      ]
    }
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'src/lib/rig/*.js', 'src/lib/fitting/*.js'])
]);

export default eslintConfig;
