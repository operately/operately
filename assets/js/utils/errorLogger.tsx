export function setupTestErrorLogger() {
  if (window.appConfig.environment === "test") {
    window.addEventListener("error", function (e) {
      const stackLines = e.error.stack.split("\n");

      console.log("                                ");
      console.log("                                ");
      console.log("     Javascript error:");
      console.log("       " + e.error.message);
      console.log("                                ");
      console.log("     Stack trace:               ");
      console.log("                                ");

      stackLines.forEach(function (line: string) {
        console.log("       " + line);
      });

      return false;
    });
  }
}
