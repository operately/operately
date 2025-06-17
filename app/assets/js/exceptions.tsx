function setUpExceptionHandling() {
  if (window.appConfig.sentry.enabled) {
    Sentry.init({
      dsn: window.appConfig.sentry.dsn,
      integrations: [
        new Sentry.BrowserTracing({
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes,
          ),
        }),
      ],
      enableTracing: false,
    });
  }

  window.addEventListener("error", function (event) {
    console.error("Global error caught:", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      stack: event.error?.stack,
    });

    // Send to logging service
    logToService(event.error);

    // DON'T return true or call preventDefault()
    // Let the error bubble up normally so tests fail
  });
}
