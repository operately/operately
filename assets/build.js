const esbuild = require("esbuild");

const args = process.argv.slice(2);
const watch = args.includes('--watch');
const deploy = args.includes('--deploy');

const loader = {};

const plugins = [];

// Define esbuild options
let opts = {
  entryPoints: ["js/app.js"],
  bundle: true,
  logLevel: "info",
  target: "es2017",
  outdir: "../priv/static/assets",
  external: ["*.css", "fonts/*", "images/*"],
  loader: loader,
  plugins: plugins,
  sourcemap: true,
};

if (deploy) {
  opts = {
    ...opts,
    minify: true,
  };
}

if (watch) {
  console.log(esbuild.version);

  opts = {
    ...opts,
    sourcemap: "inline",
    watch: {
      onRebuild(error, result) {
        if (error) {
          console.error("watch build failed:", error);
        } else {
          console.log("watch build succeeded:", result);
        }
      }
    }
  };

  esbuild
    .build(opts)
    .then((result) => {
      console.log("watch build succeeded:", result);
    })
    .catch((_error) => {
      console.error("watch build failed:", _error);
      process.exit(1);
    });

} else {
  esbuild.build(opts);
}
