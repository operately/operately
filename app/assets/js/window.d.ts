declare global {
  interface SentryConfig {
    dsn: string;
    enabled: boolean;
  }

  interface ApiConfig {
    socketToken: string;
  }

  interface AiConvoAction {
    id: string;
    label: string;
    context: string;
  }

  interface AppConfig {
    configured: boolean;
    environment: string;
    demoBuilder: boolean;

    allowLoginWithEmail: boolean;
    allowSignupWithEmail: boolean;

    allowLoginWithGoogle: boolean;
    allowSignupWithGoogle: boolean;

    version: string;
    sentry: SentryConfig;
    api: ApiConfig;

    showDevBar: boolean;
    account: {
      id: number;
    };

    aiActions: AiConvoAction[];
  }

  interface Window {
    appConfig: AppConfig;
    __tests?: any;
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
