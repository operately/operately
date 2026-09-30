import { spawn } from "node:child_process";
import { readFile, writeFile, rm, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";
import * as esbuild from "esbuild";
import postcss from "postcss";
import postcssImport from "postcss-import";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
process.chdir(root);
const watching = process.argv.includes("--watch");
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

const options = {
  entryPoints: {
    index: "src/index.tsx",
  },
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  chunkNames: "chunks/[name]-[hash]",
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  packages: "external",
  logLevel: "info",
};

async function buildStyles() {
  const from = path.join(root, "styles/index.css");
  const configPath = require.resolve("../tailwind.config.js");
  delete require.cache[configPath];
  const tailwindConfig = require(configPath);
  const result = await postcss([
    postcssImport(),
    tailwindcss({
      ...tailwindConfig,
      content: [
        "./src/**/*.{ts,tsx}",
        "!./src/**/*.stories.tsx",
        "!./src/**/*.test.{ts,tsx}",
        "!./src/**/mockData*",
        "!./src/**/tests/**",
        "!./src/utils/storybook/**",
      ],
    }),
    autoprefixer(),
  ]).process(await readFile(from, "utf8"), { from, to: "dist/styles.css" });
  await writeFile("dist/styles.css", result.css);
}

function declarations() {
  const args = ["scripts/build-types.mjs"];
  if (watching) args.push("--watch");
  const child = spawn(process.execPath, args, { stdio: "inherit" });
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Declaration build failed (${code})`))));
  });
}

if (watching) {
  // Share esbuild's polling watcher instead of opening a native watcher for
  // every source directory. Styles rebuild alongside component class changes.
  const context = await esbuild.context({
    ...options,
    plugins: [
      {
        name: "watch-styles",
        setup(build) {
          build.onLoad({ filter: /src\/index\.tsx$/ }, async ({ path: filename }) => ({
            contents: await readFile(filename, "utf8"),
            loader: "tsx",
            resolveDir: path.dirname(filename),
            watchFiles: [
              path.join(root, "tailwind.config.js"),
              ...(await readdir(path.join(root, "styles"))).map((name) => path.join(root, "styles", name)),
            ],
            watchDirs: [path.join(root, "styles")],
          }));
          build.onEnd(async (result) => {
            if (result.errors.length === 0) await buildStyles();
          });
        },
      },
    ],
  });
  await context.watch();
  void declarations().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  await Promise.all([esbuild.build(options), declarations(), buildStyles()]);
}
