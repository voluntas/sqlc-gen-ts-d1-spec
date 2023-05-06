import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    cache: false,
    environment: 'miniflare',
    environmentOptions: {
      d1Databases: ['D1_TEST'],
      globals: { KEY: 'value' },
    },
  },
})
