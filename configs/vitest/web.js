import { baseTestConfig } from './base.js';

export const webTestConfig = {
  ...baseTestConfig,
  test: {
    ...baseTestConfig.test,
    environment: 'jsdom',
    coverage: { ...baseTestConfig.test.coverage },
  },
};
