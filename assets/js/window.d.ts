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
    companyID: string;

    sentry: SentryConfig;
    api: ApiConfig;
  }

  interface Window {
    appConfig: AppConfig;
  }
}

import "react-datepicker";

declare module 'react-datepicker' {
  interface ReactDatePickerProps {
    renderYearContent?: (number: number) => React.ReactNode;
    renderQuarterContent?: (quarter: string) => React.ReactNode;
  }
}

export {};
