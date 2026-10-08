import type { AnalyticsConfig, AnalyticsSdk } from "./analytics/browser";

declare global {
  interface SentryConfig {
    dsn: string;
    enabled: boolean;
  }

  interface ApiConfig {
    socketToken: string;
  }

  interface AppConfig {
    configured: boolean;
    environment: string;
    baseUrl?: string;
    demoBuilder: boolean;

    allowLoginWithEmail: boolean;
    allowSignupWithEmail: boolean;

    allowLoginWithGoogle: boolean;
    allowSignupWithGoogle: boolean;

    version: string;
    releaseVersion?: string | null;
    sentry: SentryConfig;
    api: ApiConfig;

    showDevBar: boolean;
    analytics?: AnalyticsConfig;
    account: {
      id: string;
    };

    discordUrl: string;
    bookDemoUrl: string;
    billingEnabled: boolean;
    updateBadgeEnabled?: boolean;
  }

  interface Window {
    appConfig: AppConfig;
    posthog?: AnalyticsSdk;
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
