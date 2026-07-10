const { getJestConfig } = require("@storybook/test-runner");

const launchOptions = {
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
};

if (process.env.CHROMIUM_EXECUTABLE_PATH) {
  launchOptions.executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
} else if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD) {
  launchOptions.executablePath = "/usr/bin/chromium-browser";
}

module.exports = {
  ...getJestConfig(),
  testEnvironmentOptions: {
    "jest-playwright": {
      browsers: ["chromium"],
      launchOptions,
    },
  },
};
