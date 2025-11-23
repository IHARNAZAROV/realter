import js from '@eslint/js'
import globals from 'globals'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['js/customgpt.js'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Добавляем jQuery и $ как глобальные переменные
        jQuery: 'readonly',
        $: 'readonly'
      }
    }
  }
])
