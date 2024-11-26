declare global {
  interface SentryConfig {
    dsn: string;
    enabled: boolean;
  }

  interface ApiConfig {
    socketToken: string;
  }

  interface AppConfig {
    environment: string;
    demoBuilder: boolean;
    allowLoginWithGoogle: boolean;

    sentry: SentryConfig;
    api: ApiConfig;

    showDevBar: boolean;
    account: {
      id: number;
    };
  }

  interface Window {
    appConfig: AppConfig;
  }
}

import "react-datepicker";

declare module "react-datepicker" {
  interface ReactDatePickerProps {
    renderYearContent?: (number: number) => React.ReactNode;
    renderQuarterContent?: (quarter: string) => React.ReactNode;
  }
}

export {};
