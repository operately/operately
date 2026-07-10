const { getJestConfig } = require("@storybook/test-runner");

module.exports = {
  ...getJestConfig(),
  testEnvironmentOptions: {
    "jest-playwright": {
      browsers: ["chromium"],
      launchOptions: {
        executablePath: "/usr/bin/chromium-browser",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      },
    },
  },
};
