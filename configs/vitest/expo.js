import { baseTestConfig } from './base.js';

export const expoTestConfig = {
  ...baseTestConfig,
  test: {
    ...baseTestConfig.test,
    environment: 'jsdom',
    coverage: { ...baseTestConfig.test.coverage },
    server: {
      deps: {
        inline: [/react-native/, /expo/, /@react-navigation/],
      },
    },
  },
};
