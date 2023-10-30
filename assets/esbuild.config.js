const { sentryEsbuildPlugin } = require("@sentry/esbuild-plugin");

require("esbuild").build({
  sourcemap: true, // Source map generation must be turned on
  plugins: [
    // Put the Sentry esbuild plugin after all other plugins
    sentryEsbuildPlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
