import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

/**
 * ✅ Configuración ESLint – solo analiza /src
 * - Ignora automáticamente .next, node_modules, dist, build, etc.
 * - Compatible con Next.js 15 y TypeScript
 */
const eslintConfig = [
  // Config base de Next.js y TS
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    files: ['src/**/*.{js,jsx,ts,tsx}'], // 🔹 Solo archivos dentro de src/
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/dist/**',
      '**/build/**',
      'next-env.d.ts',
      '**/*.config.*',
      '**/*.mjs',
    ],
  },
]

export default eslintConfig
