const esbuild = require("esbuild");
const path = require("path");

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
  bundle: true,
  sourcemap: true,
  alias: {
    'turboui': path.resolve(__dirname, '../../turboui/dist')
  }
};

if (deploy) {
  opts = {...opts, minify: true};
}

if (watch) {
  opts = {...opts, sourcemap: "inline"};
}


async function runBuild() {
  try {
    if (watch) {
      const ctx = await esbuild.context(opts);
      await ctx.watch();
      
      console.log("Watching for changes...");
    } else {
      await esbuild.build(opts);
      console.log("Build succeeded");
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

runBuild();
