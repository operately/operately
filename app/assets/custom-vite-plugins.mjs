// based on: https://github.com/vitejs/vite/issues/19091
export const resumeStdinPlugin = {
  name: "resume-stdin",
  configureServer: () => {
    // runs when the dev server is triggered, but not on other commands:
    process.stdin.resume();
    // an 'end' listener is already added in `setupSIGTERMListener` here: https://github.com/vitejs/vite/blob/main/packages/vite/src/node/utils.ts#L1537
  },
};

// Tracking resource consumpition per JS module
export const moduleAnalyzerPlugin = {
  name: "module-analyzer",
  generateBundle(options, bundle) {
    console.log("\n=== MODULE ANALYSIS ===");
    const moduleMap = new Map();

    Object.values(bundle).forEach((chunk) => {
      if (chunk.type === "chunk") {
        Object.keys(chunk.modules || {}).forEach((moduleId) => {
          let packageName;
          if (moduleId.includes("node_modules/")) {
            const parts = moduleId.split("node_modules/")[1].split("/");
            packageName = parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
            packageName = `node_modules/${packageName}`;
          } else {
            packageName = "app-source";
          }
          moduleMap.set(packageName, (moduleMap.get(packageName) || 0) + 1);
        });
      }
    });

    const sortedModules = Array.from(moduleMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    let totalModules = 0;
    sortedModules.forEach(([packageName, count]) => {
      console.log(`${packageName.padEnd(60)} ${count.toString().padStart(4)} modules`);
      totalModules += count;
    });

    console.log(`${"TOTAL".padEnd(40)} ${totalModules.toString().padStart(4)} modules`);
    console.log("========================\n");
  },
};
