const esbuild = require("esbuild");

const args = process.argv.slice(2);
const watch = args.includes('--watch');
const deploy = args.includes('--deploy');

const loader = {};

const plugins = [];

// Define esbuild options
let opts = {
  entryPoints: ["./js/app.js"],
  bundle: true,
  logLevel: "info",
  target: "es2020",
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
  opts = {...opts, sourcemap: "inline"};

  esbuild
    .context(opts)
    .then(context => {
      context.watch();;
      console.log("watching files...");
    })
    .catch((_error) => {
      console.error("watch build failed:", _error);
      process.exit(1);
    });

} else {
  esbuild.build(opts);
}
