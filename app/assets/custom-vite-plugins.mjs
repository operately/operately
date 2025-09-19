// based on: https://github.com/vitejs/vite/issues/19091
export const resumeStdinPlugin = {
  name: "resume-stdin",
  configureServer: () => {
    // runs when the dev server is triggered, but not on other commands:
    process.stdin.resume();
    // an 'end' listener is already added in `setupSIGTERMListener` here: https://github.com/vitejs/vite/blob/main/packages/vite/src/node/utils.ts#L1537
  },
};

// Tracking resource consumption per JS module - optimized for performance
export const moduleAnalyzerPlugin = {
  name: "module-analyzer",
  generateBundle(options, bundle) {
    // Only run analysis if explicitly requested or in verbose mode
    if (!process.env.VITE_ANALYZE_MODULES && process.env.NODE_ENV !== "production") {
      return;
    }

    console.log("\n=== MODULE ANALYSIS ===");
    const moduleMap = new Map();
    let totalModules = 0;

    // Use more efficient iteration
    for (const chunk of Object.values(bundle)) {
      if (chunk.type === "chunk" && chunk.modules) {
        for (const moduleId of Object.keys(chunk.modules)) {
          totalModules++;
          let packageName;
          if (moduleId.includes("node_modules/")) {
            const parts = moduleId.split("node_modules/")[1].split("/");
            packageName = parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
            packageName = `node_modules/${packageName}`;
          } else {
            packageName = "app-source";
          }
          moduleMap.set(packageName, (moduleMap.get(packageName) || 0) + 1);
        }
      }
    }

    // Show top 10 instead of 20 for faster output
    const sortedModules = Array.from(moduleMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedModules.forEach(([packageName, count]) => {
      console.log(`${packageName.padEnd(50)} ${count.toString().padStart(4)} modules`);
    });

    console.log(`${"TOTAL".padEnd(30)} ${totalModules.toString().padStart(4)} modules`);
    console.log("========================\n");
  },
};
