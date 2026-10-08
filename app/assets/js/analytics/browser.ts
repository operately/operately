// App analytics. The website has a separate tracker in operately-website.
// Keep the operately_analytics_v1 cookie format compatible between repositories.
interface AnalyticsConfig {
  enabled: boolean;
  token?: string;
  host?: string;
  cookieDomain?: string;
  optedOut?: boolean;
}

export interface AnalyticsPage {
  path: string;
  key: string;
  companyRef?: string;
  companyId?: string;
}

export interface AnalyticsContext {
  version?: 1;
  anonymous_id?: string;
  attempt_id?: string;
  attempt_started_at?: number;
  attempt_pending?: boolean;
  attribution?: Record<string, string>;
  preference?: "denied" | "unspecified";
}

export interface AnalyticsTracker {
  visit(page: AnalyticsPage): Promise<void>;
  logout(): void;
  context(): AnalyticsContext;
}

export interface SynchronizedContext {
  optedOut: boolean;
  companyId?: string | null;
  acquisition?: Record<string, string>;
}

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  uuid?: string;
  timestamp?: string | Date;
  [key: string]: unknown;
}

// Only the SDK methods and browser capabilities used by this tracker.
export interface AnalyticsSdk {
  init(token: string, config: AnalyticsSdkConfig): void;
  get_distinct_id(): string;
  get_property(key: string): unknown;
  has_opted_out_capturing(): boolean;
  identify(id: string): void;
  reset(): void;
  resetGroups(): void;
  capture(event: string, properties: Record<string, unknown>): void;
}

export interface AnalyticsSdkConfig {
  loaded(instance: AnalyticsSdk): void;
  before_send(event: AnalyticsEvent | null): AnalyticsEvent | null;
  [key: string]: unknown;
}

export interface AnalyticsEnvironment {
  document: Pick<Document, "cookie" | "referrer" | "createElement"> & {
    head: Pick<HTMLHeadElement, "appendChild">;
  };
  location: Pick<Location, "href" | "hostname" | "protocol" | "origin">;
  navigator: { doNotTrack?: string | null; globalPrivacyControl?: boolean };
  localStorage?: Pick<Storage, "getItem" | "setItem">;
  crypto: Pick<Crypto, "randomUUID">;
  posthog?: AnalyticsSdk;
  addEventListener(type: string, listener: () => void): void;
}

export interface AnalyticsOptions {
  environment?: AnalyticsEnvironment;
  surface?: "website" | "app";
  accountId?: string | null;
  syncContext?: (context: AnalyticsContext, page: Partial<AnalyticsPage>) => Promise<SynchronizedContext>;
}

type EnabledAnalyticsConfig = AnalyticsConfig & { token: string; host: string };

interface SignupAttempt {
  id: string;
  page: string;
  kind: "invitation" | "self_service";
}

const SDK_RESET_COOKIE = "operately_analytics_reset_pending";

export function createAnalytics(config: AnalyticsConfig, options: AnalyticsOptions = {}): AnalyticsTracker {
  if (!config?.enabled || !config.token || !config.host) {
    return { visit: async () => {}, logout() {}, context: () => ({}) };
  }

  const tracker = new BrowserAnalytics({ ...config, token: config.token, host: config.host }, options);
  tracker.start();

  return {
    visit: (page) => tracker.visit(page),
    logout: () => tracker.logout(),
    context: () => tracker.context(),
  };
}

class BrowserAnalytics {
  private config: EnabledAnalyticsConfig;
  private options: AnalyticsOptions;
  private environment: AnalyticsEnvironment;
  private document: AnalyticsEnvironment["document"];
  private cookieName: string;
  private surface: "website" | "app";
  private accountId: string | null;
  private accountOptedOut: boolean;
  private trackingContext: AnalyticsContext;
  private sdk: AnalyticsSdk | undefined;
  private lastVisitKey: string | undefined;
  private sessionVersion = 0;
  private sdkResetPending = false;
  private ready: Promise<void>;
  private resolveReady: () => void = () => {};

  constructor(config: EnabledAnalyticsConfig, options: AnalyticsOptions = {}) {
    this.config = config;
    this.options = options;
    this.environment = options.environment || window;
    this.document = this.environment.document;

    this.cookieName = "operately_analytics_v1";
    this.surface = options.surface || "website";
    this.accountId = options.accountId || null;
    this.accountOptedOut = Boolean(config.optedOut);
    this.trackingContext = this.readContext() || { version: 1, preference: "unspecified" };
    this.sdk = undefined;
    this.lastVisitKey = undefined;

    this.ready = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });
  }

  start() {
    this.loadSdk();
    this.listenForPageExit();
  }

  private loadSdk() {
    // Reuse the default PostHog instance and storage name, including existing visitor IDs.
    try {
      if (this.environment.posthog?.init) {
        this.initializeSdk();
      } else {
        const script = this.document.createElement("script");
        script.async = true;
        script.crossOrigin = "anonymous";
        script.src =
          this.config.host.replace(".i.posthog.com", "-assets.i.posthog.com").replace(/\/$/, "") + "/static/array.js";

        script.onload = () => {
          try {
            this.initializeSdk();
          } catch {
            this.resolveReady();
          }
        };
        script.onerror = () => this.resolveReady();

        this.document.head.appendChild(script);
      }
    } catch {
      this.resolveReady();
    }
  }

  private initializeSdk() {
    if (!this.environment.posthog) return;
    this.environment.posthog.init(this.config.token, {
      api_host: this.config.host,
      person_profiles: "identified_only",
      save_campaign_params: false,
      save_referrer: false,
      persistence: "localStorage+cookie",
      cross_subdomain_cookie: Boolean(this.config.cookieDomain),
      cookie_expiration: 365,
      cookie_persisted_properties: ["$user_state"],
      cookieWinsOnConflict: true,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      enable_heatmaps: false,
      rageclick: false,
      capture_performance: false,
      capture_exceptions: false,
      disable_surveys: true,
      advanced_disable_flags: true,
      advanced_disable_feature_flags: true,
      advanced_disable_feature_flags_on_first_load: true,
      respect_dnt: true,
      opt_out_capturing_by_default:
        this.browserRequestsOptOut() || this.trackingContext.preference === "denied" || this.accountOptedOut,
      before_send: (event) => this.sanitize(event),
      loaded: (instance) => this.onSdkLoaded(instance),
    });
  }

  private onSdkLoaded(instance: AnalyticsSdk) {
    this.sdk = instance;
    this.resetSdkIfPending();
    this.saveContext();
    this.identifyAccount();

    this.resolveReady();
  }

  private listenForPageExit() {
    this.environment.addEventListener("pagehide", () => this.saveContext());
  }

  async visit(page: AnalyticsPage) {
    const sessionVersion = this.sessionVersion;
    // Save context before SDK loading so a fast signup/OAuth navigation retains attribution.
    this.saveContext();
    this.recordFirstTouch(page.path);
    const signupAttempt = this.startSignupAttempt(page);

    if (this.isTrackingDenied()) {
      await this.synchronizeContext(page);
      return;
    }

    await this.ready;
    if (!this.sdk || sessionVersion !== this.sessionVersion) return;

    this.identifyAccount();
    const synchronizedContext = await this.synchronizeContext(page);
    if (sessionVersion !== this.sessionVersion) return;
    if (this.isTrackingDenied() || !synchronizedContext) return;
    if (this.lastVisitKey === page.key) return;

    this.lastVisitKey = page.key;
    this.sdk.resetGroups();
    const properties = this.visitProperties(page, synchronizedContext);
    this.sdk.capture("$pageview", { ...properties, $insert_id: this.generateEventId() });
    if (signupAttempt) this.captureSignupStarted(signupAttempt, properties);
  }

  private recordFirstTouch(path: string) {
    if (this.trackingContext.attribution || this.isTrackingDenied()) return;

    const url = new URL(this.environment.location.href);
    let referrer = "";
    try {
      referrer = new URL(this.document.referrer).hostname;
    } catch {
      /* No observable referrer. */
    }

    const domain = (this.config.cookieDomain || this.environment.location.hostname).replace(/^\./, "");
    const internal = referrer === domain || referrer.endsWith("." + domain);
    // OAuth providers are authentication redirects, never acquisition sources.
    const authRedirect = referrer === "accounts.google.com";
    if (internal || authRedirect) referrer = "";

    const attribution: Record<string, string> = {
      landing_path: path,
      referrer_host: referrer,
      observed_at: new Date().toISOString(),
    };
    for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
      const value = url.searchParams.get(key);
      if (value) attribution[key] = value.slice(0, 200);
    }

    attribution.source_kind = this.classifyAcquisitionSource(attribution, internal || authRedirect);
    this.saveContext({ attribution });
  }

  private classifyAcquisitionSource(attribution: Record<string, string>, ignoredReferrer: boolean) {
    if (attribution.utm_source || attribution.utm_medium || attribution.utm_campaign) return "campaign";
    if (attribution.referrer_host) return "referral";
    if (ignoredReferrer) return "unknown";
    return "direct";
  }

  private startSignupAttempt(page: AnalyticsPage): SignupAttempt | undefined {
    const isSignupPage = page.path === "/join" || /^\/sign_up(?:\/|$)/.test(page.path);
    if (this.surface !== "app" || !isSignupPage) return;
    if (this.accountId || this.isTrackingDenied()) return;

    if (!this.trackingContext.attempt_id) {
      this.saveContext({
        attempt_id: this.generateEventId(),
        attempt_started_at: Date.now(),
        attempt_pending: true,
      });
    }

    if (!this.trackingContext.attempt_pending || !this.trackingContext.attempt_id) return;

    const isInvitation =
      page.path === "/join" || new URL(page.key, this.environment.location.origin).searchParams.has("invite_token");
    return { id: this.trackingContext.attempt_id, page: page.path, kind: isInvitation ? "invitation" : "self_service" };
  }

  private visitProperties(page: AnalyticsPage, synchronizedContext: SynchronizedContext) {
    const companyId = page.companyId || synchronizedContext.companyId || null;
    const acquisition = this.accountId ? synchronizedContext.acquisition : this.trackingContext.attribution;

    return {
      schema_version: 1,
      surface: this.surface,
      channel: "web",
      page: page.path,
      account_id: this.accountId,
      company_id: companyId,
      $groups: companyId ? { company: companyId } : {},
      acquisition: acquisition || { source_kind: "unknown" },
      occurred_at: new Date().toISOString(),
    };
  }

  private captureSignupStarted(attempt: SignupAttempt, properties: Record<string, unknown>) {
    if (this.surface !== "app" || this.accountId || !this.sdk) return;

    // A different signup tab may have already captured this attempt while we awaited the SDK/server.
    this.saveContext();
    if (!this.trackingContext.attempt_pending || this.trackingContext.attempt_id !== attempt.id) return;

    this.sdk.capture("signup_started", {
      ...properties,
      page: attempt.page,
      $insert_id: attempt.id,
      attempt_id: attempt.id,
      signup_kind: attempt.kind,
    });

    this.saveContext({ attempt_pending: false });
  }

  private sanitize(event: AnalyticsEvent | null): AnalyticsEvent | null {
    if (!event || this.isTrackingDenied() || !["$pageview", "signup_started", "$identify"].includes(event.event)) {
      return null;
    }

    const allowed = new Set([
      "distinct_id",
      "token",
      "$device_id",
      "$session_id",
      "$window_id",
      "$is_identified",
      "$anon_distinct_id",
      "$process_person_profile",
      "$lib",
      "$lib_version",
      "$browser",
      "$browser_version",
      "$os",
      "$os_version",
      "$device_type",
      "$screen_height",
      "$screen_width",
      "$viewport_height",
      "$viewport_width",
      "$insert_id",
      "schema_version",
      "surface",
      "channel",
      "account_id",
      "company_id",
      "$groups",
      "page",
      "acquisition",
      "attempt_id",
      "signup_kind",
      "occurred_at",
    ]);

    event.properties = Object.fromEntries(Object.entries(event.properties || {}).filter(([key]) => allowed.has(key)));

    // No raw URLs, titles, referrers, initial person properties, or SDK super-properties leave the browser.
    if (typeof event.properties.page === "string") {
      event.properties.$pathname = event.properties.page;
      event.properties.$current_url = this.environment.location.origin + event.properties.page;
    }

    return { uuid: event.uuid, event: event.event, properties: event.properties, timestamp: event.timestamp };
  }

  private generateEventId() {
    return this.environment.crypto.randomUUID();
  }

  private identifyAccount() {
    if (this.isTrackingDenied() || !this.sdk) return;

    if (this.surface === "app" && !this.accountId && this.sdk.get_property("$user_state") === "identified") {
      // Authentication has expired; preserve the current signup attempt while starting a new anonymous identity.
      this.sdk.reset();
    }

    const id = this.sdk.get_distinct_id();
    if (this.accountId) {
      if (this.sdk.get_property("$user_state") === "identified" && id !== this.accountId) {
        this.sdk.reset();
        this.resetContext();
      }

      if (!this.trackingContext.anonymous_id && this.sdk.get_property("$user_state") !== "identified") {
        this.saveContext({ anonymous_id: this.sdk.get_distinct_id() });
      }

      this.sdk.identify(this.accountId);
      this.clearSignupAttempt();
    } else if (this.sdk.get_property("$user_state") !== "identified") {
      this.saveContext({ anonymous_id: id });
    }
  }

  private clearSignupAttempt() {
    this.saveContext({ attempt_id: undefined, attempt_started_at: undefined, attempt_pending: undefined });
  }

  logout() {
    // Visits awaiting the SDK or context sync belong to the previous session.
    this.sessionVersion++;
    this.sdkResetPending = true;
    this.writeSdkResetCookie("1");
    this.resetSdkIfPending();
    this.accountId = null;
    this.lastVisitKey = undefined;

    this.resetContext();
  }

  private resetSdkIfPending() {
    if (!this.sdk) return;

    try {
      this.sdkResetPending ||= this.document.cookie.split("; ").includes(SDK_RESET_COOKIE + "=1");
    } catch {
      /* The in-memory flag still handles logout when cookies are unavailable. */
    }

    if (!this.sdkResetPending) return;
    this.sdk.reset();
    this.sdkResetPending = false;
    this.writeSdkResetCookie("");
  }

  private writeSdkResetCookie(value: "1" | "") {
    // Host-only state survives the logout redirect independently of the shared attribution cookie.
    try {
      const secure = this.environment.location.protocol === "https:" ? "; Secure" : "";
      const maxAge = value === "1" ? 31536000 : 0;
      this.document.cookie = `${SDK_RESET_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
    } catch {
      /* Tracking must never block logout. */
    }
  }

  private isTrackingDenied() {
    return (
      this.browserRequestsOptOut() ||
      this.hasStoredOptOut() ||
      this.trackingContext.preference === "denied" ||
      this.readContext()?.preference === "denied" ||
      this.accountOptedOut ||
      Boolean(this.sdk?.has_opted_out_capturing())
    );
  }

  private browserRequestsOptOut() {
    return this.environment.navigator.doNotTrack === "1" || this.environment.navigator.globalPrivacyControl === true;
  }

  private hasStoredOptOut() {
    const key = "__ph_opt_in_out_" + this.config.token;

    try {
      return (
        this.environment.localStorage?.getItem(key) === "0" ||
        this.document.cookie.split("; ").some((value) => value === key + "=0")
      );
    } catch {
      return false;
    }
  }

  context(): AnalyticsContext {
    return {
      ...(this.readContext() || this.trackingContext),
      preference: this.isTrackingDenied() ? "denied" : "unspecified",
    };
  }

  private async synchronizeContext(page: Partial<AnalyticsPage> = {}): Promise<SynchronizedContext | null> {
    const sessionVersion = this.sessionVersion;
    this.saveContext();
    if (!this.options.syncContext) return { optedOut: this.accountOptedOut };

    try {
      const result = await this.options.syncContext(this.context(), page);
      if (sessionVersion !== this.sessionVersion) return null;

      this.accountOptedOut = Boolean(result.optedOut);
      this.saveContext();

      return result;
    } catch {
      // Fail closed for analytics only; app navigation remains independent.
      return null;
    }
  }

  private readContext(): AnalyticsContext | null {
    try {
      const cookie = this.document.cookie.split("; ").find((value) => value.startsWith(this.cookieName + "="));
      const stored: unknown = cookie && JSON.parse(decodeURIComponent(cookie.slice(this.cookieName.length + 1)));
      if (isRecord(stored) && stored.version === 1) return this.restoreContext(stored);
    } catch {
      /* Analytics storage is optional. */
    }

    return null;
  }

  private restoreContext(stored: Record<string, unknown>): AnalyticsContext {
    const context: AnalyticsContext = {
      version: 1,
      preference: stored.preference === "denied" ? "denied" : "unspecified",
    };

    for (const key of ["anonymous_id", "attempt_id"] as const) {
      const value = stored[key];
      if (typeof value === "string" && /^[a-f0-9-]{36}$/i.test(value)) context[key] = value;
    }

    const signupAttemptLifetime = 24 * 60 * 60 * 1000;
    if (
      context.attempt_id &&
      typeof stored.attempt_started_at === "number" &&
      Date.now() - stored.attempt_started_at < signupAttemptLifetime
    ) {
      context.attempt_started_at = stored.attempt_started_at;
      context.attempt_pending = stored.attempt_pending === true;
    } else {
      delete context.attempt_id;
    }

    if (isRecord(stored.attribution)) {
      context.attribution = this.sanitizeStoredAttribution(stored.attribution);
    }

    return context;
  }

  private sanitizeStoredAttribution(stored: Record<string, unknown>) {
    const attribution: Record<string, string> = {};
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "landing_path",
      "referrer_host",
      "observed_at",
      "source_kind",
    ]) {
      const value = stored[key];
      if (typeof value === "string" && value.length <= 512) attribution[key] = value;
    }

    if (attribution.landing_path) attribution.landing_path = attribution.landing_path.split(/[?#]/)[0] ?? "";

    return attribution;
  }

  private saveContext(changes: Partial<AnalyticsContext> = {}) {
    // Ordinary writes apply only their own changes to the current shared state.
    // In particular, a stale tab must not erase, replay, or resurrect a signup attempt.
    const preference = this.isTrackingDenied() ? "denied" : "unspecified";
    const sharedContext = this.readContext() || this.trackingContext;
    this.trackingContext = { ...sharedContext, ...changes, preference };

    this.writeContextCookie();
  }

  private resetContext() {
    // Account switches and logout intentionally discard shared acquisition/signup state.
    const preference = this.isTrackingDenied() ? "denied" : "unspecified";
    this.trackingContext = { version: 1, preference };

    this.writeContextCookie();
  }

  private writeContextCookie() {
    try {
      const domain = this.config.cookieDomain ? "; Domain=" + this.config.cookieDomain : "";
      const secure = this.environment.location.protocol === "https:" ? "; Secure" : "";

      this.document.cookie =
        this.cookieName +
        "=" +
        encodeURIComponent(JSON.stringify(this.trackingContext)) +
        "; Path=/; Max-Age=31536000; SameSite=Lax" +
        domain +
        secure;
    } catch {
      /* Tracking must never block navigation or authentication. */
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
