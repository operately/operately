import { setImmediate } from "node:timers";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import {
  createAnalytics,
  type AnalyticsOptions,
  type AnalyticsEnvironment,
  type AnalyticsSdk,
  type AnalyticsSdkConfig,
  type AnalyticsEvent,
  type AnalyticsContext,
  type SynchronizedContext,
} from "./browser";

interface BrowserOptions extends Pick<AnalyticsOptions, "surface" | "accountId" | "syncContext"> {
  cookie?: string;
  sharedCookies?: Map<string, string>;
  denied?: boolean;
  sdkAccountId?: string | null;
  optedOut?: boolean;
  url?: string;
  deferSdkLoad?: boolean;
  loadViaScript?: boolean;
}

function browser({
  cookie = "",
  sharedCookies,
  denied = false,
  accountId = null,
  sdkAccountId = accountId,
  optedOut = false,
  syncContext,
  url = "https://app.test/sign_up?utm_source=launch&token=secret",
  surface = "app",
  deferSdkLoad = false,
  loadViaScript = false,
}: BrowserOptions = {}) {
  const events: AnalyticsEvent[] = [];
  let identified = Boolean(sdkAccountId);
  let distinctId = sdkAccountId || "11111111-1111-4111-8111-111111111111";
  let config: AnalyticsSdkConfig | undefined;
  let resetCount = 0;
  const listeners = new Map<string, () => void>();
  const localStorage = new Map<string, string>();
  const script: { src?: string; async?: boolean; crossOrigin?: string; onload?: () => void; onerror?: () => void } = {};
  const appendScript = jest.fn((node) => node);
  const jar =
    sharedCookies ||
    new Map(
      cookie
        .split("; ")
        .filter(Boolean)
        .map((c): [string, string] => {
          const [key = "", value = ""] = c.split("=");
          return [key, value];
        }),
    );
  const doc = {
    referrer: "https://google.com/search?q=private",
    get cookie() {
      return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    set cookie(value: string) {
      const [pair = ""] = value.split(";");
      const [k = "", v = ""] = pair.split("=");
      jar.set(k, v);
    },
    createElement: jest.fn().mockReturnValue(script),
    head: { appendChild: appendScript },
  };
  const sdk: AnalyticsSdk = {
    init(_token, options) {
      config = options;
      if (!deferSdkLoad) options.loaded(sdk);
    },
    get_distinct_id: () => distinctId,
    get_property: (key) => key === "$user_state" && (identified ? "identified" : "anonymous"),
    has_opted_out_capturing: () => denied,
    identify(id) {
      identified = true;
      distinctId = id;
    },
    reset() {
      identified = false;
      resetCount++;
      distinctId = "22222222-2222-4222-8222-222222222222";
    },
    resetGroups() {},
    capture(event, properties) {
      assert.ok(config);
      const payload = config.before_send({
        event,
        $set_once: { $initial_current_url: "https://private?token=secret" },
        properties: {
          distinct_id: distinctId,
          $current_url: "https://app.test/secret?token=x",
          $set: { email: "private" },
          ...properties,
        },
      });
      if (payload) events.push(payload);
    },
  };
  const env = {
    document: doc,
    navigator: {} as AnalyticsEnvironment["navigator"],
    location: new URL(url),
    localStorage: {
      getItem: (key: string) => localStorage.get(key) ?? null,
      setItem: (key: string, value: string) => localStorage.set(key, value),
    },
    posthog: loadViaScript ? undefined : sdk,
    crypto: { randomUUID },
    addEventListener: (name: string, listener: () => void) => listeners.set(name, listener),
  };
  const tracker = createAnalytics(
    { enabled: true, token: "test", host: "https://us.i.posthog.com", cookieDomain: ".operately.test", optedOut },
    { environment: env, surface, accountId, syncContext },
  );
  return {
    tracker,
    events,
    doc,
    env,
    script,
    appendScript,
    loadScript: () => {
      env.posthog = sdk;
      assert.ok(script.onload);
      script.onload();
    },
    failScript: () => {
      assert.ok(script.onerror);
      script.onerror();
    },
    loadSdk: () => {
      assert.ok(config);
      config.loaded(sdk);
    },
    emit: (name: string) => listeners.get(name)?.(),
    get config() {
      assert.ok(config);
      return config;
    },
    get resetCount() {
      return resetCount;
    },
  };
}

test("first touch persists, signup attempt is reused, payload is sanitized", async () => {
  const b = browser();
  await b.tracker.visit({ path: "/sign_up", key: "/sign_up" });
  await b.tracker.visit({ path: "/sign_up/email", key: "/sign_up/email" });
  assert.equal(b.events.filter((e) => e.event === "signup_started").length, 1);
  assert.equal(b.events.filter((e) => e.event === "$pageview").length, 2);
  assert.equal(b.tracker.context().attribution?.utm_source, "launch");
  assert.equal(b.tracker.context().attribution?.landing_path, "/sign_up");
  assert.ok(!JSON.stringify(b.events).includes("secret"));
  assert.ok(!JSON.stringify(b.events).includes("private"));
  b.env.location = new URL("https://app.test/?utm_source=later");
  await b.tracker.visit({ path: "/", key: "/" });
  assert.equal(b.tracker.context().attribution?.utm_source, "launch");
  assert.equal(b.config.capture_pageview, false);
  assert.equal(b.config.autocapture, false);
  assert.equal(b.config.save_campaign_params, false);
  assert.equal(b.config.save_referrer, false);
  assert.equal(b.config.disable_session_recording, true);
});

test("failed context synchronization suppresses events without breaking navigation", async () => {
  const b = browser({
    syncContext: async () => {
      throw new Error("Network unavailable");
    },
  });
  await b.tracker.visit({ path: "/", key: "/" });
  assert.deepEqual(b.events, []);
});

test("email invitation signup is captured once across reloads without exposing the token", async () => {
  const sharedCookies = new Map<string, string>();
  const url = "https://app.test/join?token=private-invitation";
  const page = { path: "/join", key: "/join?token=private-invitation" };
  const invited = browser({ sharedCookies, url });
  await invited.tracker.visit(page);

  const events = signupEvents(invited);
  assert.equal(events.length, 1);
  assert.equal(events[0]?.properties.signup_kind, "invitation");
  assert.equal(events[0]?.properties.page, "/join");
  assert.ok(events[0]?.properties.attempt_id);
  assert.ok(!JSON.stringify(invited.events).includes("private-invitation"));

  const reloaded = browser({ sharedCookies, url });
  await reloaded.tracker.visit(page);
  assert.equal(signupEvents(reloaded).length, 0);
  assert.equal(reloaded.tracker.context().attempt_id, invited.tracker.context().attempt_id);
});

test("invite previews and capacity pages do not start signup attempts", async () => {
  const b = browser({ url: "https://app.test/join/private-invitation" });
  await b.tracker.visit({ path: "/join/:token", key: "/join/private-invitation" });
  await b.tracker.visit({ path: "/join/:token/full", key: "/join/private-invitation/full" });
  assert.equal(signupEvents(b).length, 0);
  assert.equal(b.tracker.context().attempt_id, undefined);
});

test("signup classification uses the visited URL even when navigation changes during sync", async () => {
  const b = browser({
    url: "https://app.test/sign_up?invite_token=private-invitation",
    syncContext: async () => {
      b.env.location = new URL("https://app.test/log_in");
      return { optedOut: false };
    },
  });
  await b.tracker.visit({ path: "/sign_up", key: "/sign_up?invite_token=private-invitation" });
  assert.equal(signupEvents(b)[0]?.properties.signup_kind, "invitation");
});

test("logout discards a pending workspace visit and allows new anonymous visits", async () => {
  let completeSync: ((context: SynchronizedContext) => void) | undefined;
  const b = browser({
    accountId: "account",
    syncContext: () =>
      new Promise((resolve) => {
        completeSync = resolve;
      }),
  });
  const oldVisit = b.tracker.visit({ path: "/:companyId", key: "/old-company" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(completeSync);

  b.tracker.logout();
  completeSync({ optedOut: false, companyId: "old-company" });
  await oldVisit;
  assert.equal(b.events.length, 0);

  const newVisit = b.tracker.visit({ path: "/log_in", key: "/log_in" });
  await new Promise((resolve) => setImmediate(resolve));
  completeSync({ optedOut: false });
  await newVisit;
  assert.equal(b.events.length, 1);
  assert.equal(b.events[0]?.properties.account_id, null);
  assert.equal(b.events[0]?.properties.company_id, null);
  assert.equal(b.events[0]?.properties.distinct_id, "22222222-2222-4222-8222-222222222222");
});

test("logout discards visits waiting for SDK loading before they synchronize", async () => {
  const syncContext = jest.fn(async () => ({ optedOut: false }));
  const b = browser({ accountId: "account", deferSdkLoad: true, syncContext });
  const visit = b.tracker.visit({ path: "/:companyId", key: "/old-company" });
  b.tracker.logout();
  b.loadSdk();
  await visit;
  assert.deepEqual(b.events, []);
  expect(syncContext).not.toHaveBeenCalled();
});

test("opt-outs suppress events and synchronize denial", async () => {
  const synchronizedPreferences: AnalyticsContext["preference"][] = [];
  const b = browser({
    denied: true,
    syncContext: async (context) => {
      synchronizedPreferences.push(context.preference);
      return { optedOut: true };
    },
  });
  await b.tracker.visit({ path: "/", key: "/" });
  assert.deepEqual(b.events, []);
  assert.equal(b.tracker.context().preference, "denied");
  assert.deepEqual(synchronizedPreferences, ["denied"]);
});

test("account opt-out stays denied despite an old granted cookie", async () => {
  const synchronizedPreferences: AnalyticsContext["preference"][] = [];
  const b = browser({
    cookie: "operately_analytics_v1=" + encodeURIComponent(JSON.stringify({ version: 1, preference: "granted" })),
    optedOut: true,
    syncContext: async (context) => {
      synchronizedPreferences.push(context.preference);
      return { optedOut: true };
    },
  });
  await b.tracker.visit({ path: "/", key: "/" });
  await b.tracker.visit({ path: "/new", key: "/new" });
  assert.deepEqual(b.events, []);
  assert.deepEqual(synchronizedPreferences, ["denied", "denied"]);
});

function sharedTabs() {
  // Subdomains share cookies, but each tab has its own tracker and origin's localStorage.
  const sharedCookies = new Map();
  const website = browser({ sharedCookies, url: "https://operately.test/", surface: "website" });
  const app = browser({ sharedCookies, url: "https://app.operately.test/" });
  const optOutInApp = () => {
    app.env.localStorage.setItem("__ph_opt_in_out_test", "0");
    app.emit("pagehide");
  };
  return { website, app, optOutInApp };
}

function storedPreference(tab: ReturnType<typeof browser>) {
  const cookie = tab.doc.cookie.split("; ").find((value) => value.startsWith("operately_analytics_v1="));
  assert.ok(cookie);
  const encoded = cookie.split("=")[1];
  assert.ok(encoded);
  return JSON.parse(decodeURIComponent(encoded)).preference;
}

test("an open website tab respects an app denial before sending events", async () => {
  const { website, optOutInApp } = sharedTabs();
  await website.tracker.visit({ path: "/", key: "/" });
  assert.equal(website.events.length, 1);
  optOutInApp();

  // Even a queued SDK event must recheck the shared cookie before sending.
  assert.equal(website.config.before_send({ event: "$pageview", properties: {} }), null);
  assert.equal(website.tracker.context().preference, "denied");
  await website.tracker.visit({ path: "/help", key: "/help" });
  assert.equal(website.events.length, 1);
  assert.equal(storedPreference(website), "denied");
});

test("page exit and logout cannot overwrite a shared denial with stale context", () => {
  for (const action of [
    (tab: ReturnType<typeof browser>) => tab.emit("pagehide"),
    (tab: ReturnType<typeof browser>) => tab.tracker.logout(),
  ]) {
    const { website, optOutInApp } = sharedTabs();
    optOutInApp();
    action(website);
    assert.equal(storedPreference(website), "denied");
  }
});

test("a server account denial reaches the shared cookie and other open tabs", async () => {
  const sharedCookies = new Map();
  const website = browser({ sharedCookies, url: "https://operately.test/", surface: "website" });
  const app = browser({
    sharedCookies,
    url: "https://app.operately.test/",
    syncContext: async () => ({ optedOut: true }),
  });
  await app.tracker.visit({ path: "/", key: "/" });
  assert.equal(storedPreference(app), "denied");
  await website.tracker.visit({ path: "/", key: "/" });
  assert.deepEqual(website.events, []);
});

test("DNT/GPC and blocked storage do not break product use", async () => {
  const b = browser();
  b.env.navigator.globalPrivacyControl = true;
  await b.tracker.visit({ path: "/", key: "/" });
  assert.deepEqual(b.events, []);
  assert.equal(b.tracker.context().preference, "denied");
});

test("company context clears outside company routes; successful logout resets identity", async () => {
  const b = browser({ accountId: "account" });
  await b.tracker.visit({ path: "/:companyId", key: "/one", companyId: "one" });
  await b.tracker.visit({ path: "/", key: "/" });
  assert.deepEqual(b.events[0]?.properties.$groups, { company: "one" });
  assert.deepEqual(b.events[1]?.properties.$groups, {});
  b.tracker.logout();
  assert.equal(b.resetCount, 1);
});

test("same navigation, rerenders, and fragment-only changes do not duplicate visits", async () => {
  const b = browser();
  await b.tracker.visit({ path: "/:companyId/projects/:id", key: "/company/projects/one" });
  b.env.location.hash = "#private";
  await b.tracker.visit({ path: "/:companyId/projects/:id", key: "/company/projects/one" });
  await b.tracker.visit({ path: "/:companyId/projects/:id", key: "/company/projects/two" });
  assert.equal(b.events.length, 2);
});

test("cookie metadata is allowlisted before any event is sent", async () => {
  const cookie =
    "operately_analytics_v1=" +
    encodeURIComponent(
      JSON.stringify({
        version: 1,
        attribution: { utm_source: "saved", email: "secret@example.com", landing_path: "/?token=secret" },
        credential: "secret",
      }),
    );
  const b = browser({ cookie });
  await b.tracker.visit({ path: "/", key: "/" });
  assert.ok(!JSON.stringify(b.events).includes("secret"));
  assert.equal(b.tracker.context().attribution?.utm_source, "saved");
});

function signupEvents(tab: ReturnType<typeof browser>) {
  return tab.events.filter((event) => event.event === "signup_started");
}

function storedContext(tab: ReturnType<typeof browser>): AnalyticsContext {
  const cookie = tab.doc.cookie.split("; ").find((value) => value.startsWith("operately_analytics_v1="));
  assert.ok(cookie);
  const encoded = cookie.split("=")[1];
  assert.ok(encoded);
  return JSON.parse(decodeURIComponent(encoded));
}

test("closing an older marketing tab preserves the signup attempt across reload", async () => {
  const sharedCookies = new Map();
  const website = browser({ sharedCookies, url: "https://operately.test/?utm_source=launch", surface: "website" });
  await website.tracker.visit({ path: "/", key: "/" });
  const signup = browser({ sharedCookies });
  await signup.tracker.visit({ path: "/sign_up", key: "/sign_up" });
  const attemptId = signup.tracker.context().attempt_id;
  assert.ok(attemptId);
  assert.equal(signupEvents(signup).length, 1);

  website.emit("pagehide");
  assert.equal(storedContext(website).attempt_id, attemptId);
  assert.equal(storedContext(website).attempt_pending, false);

  const reloaded = browser({ sharedCookies });
  await reloaded.tracker.visit({ path: "/sign_up", key: "/sign_up" });
  assert.equal(reloaded.tracker.context().attempt_id, attemptId);
  assert.equal(reloaded.tracker.context().attribution?.utm_source, "launch");
  assert.equal(signupEvents(reloaded).length, 0);
});

test("website writes preserve a pending signup without emitting or consuming it", async () => {
  const sharedCookies = new Map();
  let completeSync: ((context: SynchronizedContext) => void) | undefined;
  const signup = browser({
    sharedCookies,
    syncContext: () =>
      new Promise((resolve) => {
        completeSync = resolve;
      }),
  });
  const visit = signup.tracker.visit({ path: "/sign_up", key: "/sign_up" });
  await new Promise((resolve) => setImmediate(resolve));
  const attemptId = signup.tracker.context().attempt_id;

  const website = browser({ sharedCookies, surface: "website", url: "https://operately.test/" });
  await website.tracker.visit({ path: "/", key: "/" });
  website.emit("pagehide");
  assert.equal(storedContext(website).attempt_id, attemptId);
  assert.equal(storedContext(website).attempt_pending, true);
  assert.equal(signupEvents(website).length, 0);

  assert.ok(completeSync);
  completeSync({ optedOut: false });
  await visit;
  assert.equal(signupEvents(signup).length, 1);
  // This website tab cached pending=true before the signup event was captured.
  website.emit("pagehide");
  assert.equal(storedContext(website).attempt_pending, false);
});

for (const reset of ["authentication", "account switch", "logout"]) {
  test(`${reset} clears signup state without stale tabs resurrecting it`, async () => {
    const sharedCookies = new Map();
    const signup = browser({ sharedCookies });
    await signup.tracker.visit({ path: "/sign_up", key: "/sign_up" });
    const oldAttemptId = signup.tracker.context().attempt_id;
    const staleTab = browser({ sharedCookies, surface: "website", url: "https://operately.test/" });

    if (reset === "authentication") browser({ sharedCookies, accountId: "account", sdkAccountId: null });
    else if (reset === "account switch")
      browser({ sharedCookies, accountId: "new-account", sdkAccountId: "old-account" });
    else signup.tracker.logout();

    staleTab.emit("pagehide");
    const context = storedContext(staleTab);
    assert.equal(context.attempt_id, undefined);
    assert.equal(context.attempt_started_at, undefined);
    assert.equal(context.attempt_pending, undefined);

    const newSignup = browser({ sharedCookies });
    await newSignup.tracker.visit({ path: "/sign_up", key: "/sign_up" });
    assert.notEqual(newSignup.tracker.context().attempt_id, oldAttemptId);
    assert.equal(signupEvents(newSignup).length, 1);
  });
}

test("an older app tab reuses the shared attempt instead of starting another", async () => {
  const sharedCookies = new Map();
  const older = browser({ sharedCookies });
  const newer = browser({ sharedCookies });
  await newer.tracker.visit({ path: "/sign_up", key: "/sign_up" });
  await older.tracker.visit({ path: "/sign_up", key: "/sign_up" });
  assert.equal(older.tracker.context().attempt_id, newer.tracker.context().attempt_id);
  assert.equal(signupEvents(older).length, 0);
});

test("an expired shared attempt is not restored from an older tab's cache", async () => {
  const sharedCookies = new Map();
  const signup = browser({ sharedCookies });
  await signup.tracker.visit({ path: "/sign_up", key: "/sign_up" });
  const original = storedContext(signup);
  sharedCookies.set(
    "operately_analytics_v1",
    encodeURIComponent(
      JSON.stringify({
        ...original,
        attempt_started_at: Date.now() - 25 * 60 * 60 * 1000,
      }),
    ),
  );
  signup.emit("pagehide");
  assert.equal(storedContext(signup).attempt_id, undefined);

  const reloaded = browser({ sharedCookies });
  await reloaded.tracker.visit({ path: "/sign_up", key: "/sign_up" });
  assert.notEqual(reloaded.tracker.context().attempt_id, original.attempt_id);
  assert.equal(signupEvents(reloaded).length, 1);
});

for (const otherVisitTiming of ["before signup", "after signup"]) {
  test(`a non-signup visit started ${otherVisitTiming} cannot consume the signup attempt`, async () => {
    const responses = new Map<string, (context: SynchronizedContext) => void>();
    const b = browser({
      url: "https://app.test/sign_up?invite_token=private-invitation",
      syncContext: (_, page) =>
        new Promise((resolve) => {
          responses.set(page.path ?? "", resolve);
        }),
    });
    const signupPage = { path: "/sign_up", key: "/sign_up?invite_token=private-invitation" };
    const otherPage = { path: "/log_in", key: "/log_in" };
    const firstPage = otherVisitTiming === "before signup" ? otherPage : signupPage;
    const secondPage = otherVisitTiming === "before signup" ? signupPage : otherPage;
    const firstVisit = b.tracker.visit(firstPage);
    const secondVisit = b.tracker.visit(secondPage);
    await new Promise((resolve) => setImmediate(resolve));

    const completeOtherVisit = responses.get(otherPage.path);
    assert.ok(completeOtherVisit);
    completeOtherVisit({ optedOut: false });
    await (otherVisitTiming === "before signup" ? firstVisit : secondVisit);
    assert.equal(signupEvents(b).length, 0);
    assert.equal(b.tracker.context().attempt_pending, true);

    const completeSignup = responses.get(signupPage.path);
    assert.ok(completeSignup);
    completeSignup({ optedOut: false });
    await Promise.all([firstVisit, secondVisit]);
    assert.equal(signupEvents(b).length, 1);
    assert.equal(signupEvents(b)[0]?.properties.page, "/sign_up");
    assert.equal(signupEvents(b)[0]?.properties.signup_kind, "invitation");
  });
}

test("fresh-page startup inserts the SDK script and tracks after it loads", async () => {
  const b = browser({ loadViaScript: true });
  const visit = b.tracker.visit({ path: "/sign_up", key: "/sign_up" });
  expect(b.doc.createElement).toHaveBeenCalledWith("script");
  expect(b.appendScript).toHaveBeenCalledTimes(1);
  expect(b.appendScript).toHaveBeenCalledWith(b.script);
  assert.equal(b.script.src, "https://us-assets.i.posthog.com/static/array.js");
  assert.equal(b.script.async, true);
  assert.equal(b.script.crossOrigin, "anonymous");
  assert.equal(b.events.length, 0);
  assert.equal(b.tracker.context().attribution?.utm_source, "launch");

  b.loadScript();
  await visit;
  assert.equal(b.events.filter((event) => event.event === "$pageview").length, 1);
  assert.equal(signupEvents(b).length, 1);
});

test("SDK script failure resolves pending visits without sending events", async () => {
  const syncContext = jest.fn(async () => ({ optedOut: false }));
  const b = browser({ loadViaScript: true, syncContext });
  const visit = b.tracker.visit({ path: "/sign_up", key: "/sign_up" });
  b.failScript();
  await visit;
  await b.tracker.visit({ path: "/log_in", key: "/log_in" });
  assert.equal(b.events.length, 0);
  expect(syncContext).not.toHaveBeenCalled();
});

test("logout before script loading resets identity before subsequent visits", async () => {
  const b = browser({ loadViaScript: true, accountId: "previous-account" });
  const oldVisit = b.tracker.visit({ path: "/:companyId", key: "/old-company" });
  b.tracker.logout();
  b.loadScript();
  await oldVisit;
  assert.equal(b.events.length, 0);
  await b.tracker.visit({ path: "/log_in", key: "/log_in" });
  assert.equal(b.resetCount, 1);
  assert.equal(b.events[0]?.properties.distinct_id, "22222222-2222-4222-8222-222222222222");
  assert.equal(b.events[0]?.properties.account_id, null);
});

test("a pending logout reset survives redirect and is consumed once", async () => {
  const sharedCookies = new Map<string, string>();
  const oldPage = browser({ sharedCookies, loadViaScript: true, accountId: "previous-account" });
  oldPage.tracker.logout();
  oldPage.emit("pagehide");

  const login = browser({
    sharedCookies,
    loadViaScript: true,
    sdkAccountId: "previous-account",
    url: "https://app.test/log_in",
  });
  login.loadScript();
  await login.tracker.visit({ path: "/log_in", key: "/log_in" });
  assert.equal(login.resetCount, 1);
  assert.equal(login.events[0]?.properties.distinct_id, "22222222-2222-4222-8222-222222222222");

  const reloaded = browser({ sharedCookies, sdkAccountId: null });
  assert.equal(reloaded.resetCount, 0);
});

test("an expired app session resets the previous identity once before tracking public pages", async () => {
  const b = browser({ sdkAccountId: "previous-account" });
  await b.tracker.visit({ path: "/log_in", key: "/log_in" });
  await b.tracker.visit({ path: "/forgot-password", key: "/forgot-password" });
  assert.equal(b.resetCount, 1);
  assert.equal(b.events.length, 2);
  for (const event of b.events) {
    assert.equal(event.properties.distinct_id, "22222222-2222-4222-8222-222222222222");
    assert.equal(event.properties.account_id, null);
  }
  assert.equal(b.tracker.context().anonymous_id, "22222222-2222-4222-8222-222222222222");
});

test("delayed SDK loading resets stale identity without losing the signup attempt or attribution", async () => {
  const synchronizedContexts: AnalyticsContext[] = [];
  const b = browser({
    sdkAccountId: "previous-account",
    loadViaScript: true,
    syncContext: async (context) => {
      synchronizedContexts.push(context);
      return { optedOut: false };
    },
  });
  const visit = b.tracker.visit({ path: "/sign_up", key: "/sign_up" });
  const attemptId = b.tracker.context().attempt_id;
  assert.ok(attemptId);
  b.loadScript();
  await visit;

  assert.equal(b.resetCount, 1);
  assert.equal(signupEvents(b).length, 1);
  assert.equal(signupEvents(b)[0]?.properties.distinct_id, "22222222-2222-4222-8222-222222222222");
  assert.equal(signupEvents(b)[0]?.properties.attempt_id, attemptId);
  assert.equal(synchronizedContexts[0]?.anonymous_id, "22222222-2222-4222-8222-222222222222");
  assert.equal(synchronizedContexts[0]?.attribution?.utm_source, "launch");
});

test("website visits preserve identified identity without an app authentication context", async () => {
  const b = browser({ surface: "website", sdkAccountId: "account", url: "https://operately.test/" });
  await b.tracker.visit({ path: "/", key: "/" });
  assert.equal(b.resetCount, 0);
  assert.equal(b.events[0]?.properties.distinct_id, "account");
});
