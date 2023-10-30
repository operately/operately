declare global {
  interface SentryConfig {
    dsn: string;
    enabled: boolean;
  }

  interface GraphqlConfig {
    socketToken: string;
  }

  interface AppConfig {
    environment: string;
    companyID: string;

    sentry: SentryConfig;
    graphql: GraphqlConfig;
  }

  interface Window {
    appConfig: AppConfig;
  }
}

export {};
