import * as Sentry from "@sentry/react";

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

export function setupSentryErrorLogger() {
  // Only setup global error handlers when Sentry is enabled and we're not in test environment
  if (window.appConfig.sentry?.enabled && window.appConfig.environment !== "test") {
    // Capture unhandled JavaScript errors
    window.addEventListener("error", function (e) {
      console.error("Unhandled JavaScript error:", e.error);
      Sentry.captureException(e.error, {
        level: "error",
        tags: {
          error_type: "javascript_error",
          source: "global_error_handler"
        },
        extra: {
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
          message: e.message
        }
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", function (e) {
      console.error("Unhandled promise rejection:", e.reason);
      Sentry.captureException(e.reason, {
        level: "error",
        tags: {
          error_type: "unhandled_promise_rejection",
          source: "global_error_handler"
        },
        extra: {
          promise: e.promise
        }
      });
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
