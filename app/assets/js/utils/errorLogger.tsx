export function setupTestErrorLogger() {
  if (window.appConfig.environment === "test") {
    window.addEventListener("error", function (e) {
      log("");
      log("");
      log("Javascript error:");
      log("  " + e.error.message);

      logStackLines(e);
    });

    window.addEventListener("unhandledrejection", function (e) {
      log("");
      log("");
      log("Unhandled promise rejection:");
      log("  " + e.reason);

      logStackLines(e);
      logAxiosErrorDetails(e);
    });
  }
}

function logStackLines(e: any) {
  if (!e.error || !e.error.stack) {
    console.log("No stack trace available.");
    return;
  }

  log("");
  log("Stack trace:");
  log("");

  e.error.stack.split("\n").forEach((line: string) => log(line));
}

function logAxiosErrorDetails(e: any) {
  if (!e.reason && !e.reason.isAxiosError) {
    return;
  }

  log("");
  log("     AxiosError details:");

  if (e.reason.config) {
    log("URL: " + e.reason.config.url);
    log("Method: " + e.reason.config.method);
  }

  if (e.reason.response) {
    log("Status: " + e.reason.response.status);
    log("Response data: " + JSON.stringify(e.reason.response.data));
  }

  if (e.reason.code) {
    log("Code: " + e.reason.code);
  }

  log("");
}

function log(message: string) {
  console.log("       " + message);
}
