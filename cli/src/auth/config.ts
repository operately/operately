import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const DEFAULT_BASE_URL = "https://app.operately.com";
export const DEFAULT_PROFILE = "default";

export interface ProfileConfig {
  token?: string;
  baseUrl?: string;
  timeoutMs?: number;
  name?: string;
  companyName?: string;
}

export interface CliConfig {
  activeProfile: string;
  profiles: Record<string, ProfileConfig>;
}

export interface RuntimeOptions {
  token: string | null;
  baseUrl: string;
  profile: string;
  timeoutMs: number;
}

export interface RuntimeOverrideOptions {
  token?: string | null;
  baseUrl?: string | null;
  profile?: string | null;
}

const CONFIG_FILE = "config.json";
const DEFAULT_TIMEOUT_MS = 30_000;

export function configPath(): string {
  return path.join(os.homedir(), ".operately", CONFIG_FILE);
}

export function defaultConfig(): CliConfig {
  return {
    activeProfile: DEFAULT_PROFILE,
    profiles: {},
  };
}

export function readConfig(): CliConfig {
  const filePath = configPath();

  if (!fs.existsSync(filePath)) {
    return defaultConfig();
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<CliConfig>;
  const profiles = Object.fromEntries(
    Object.entries(parsed.profiles ?? {}).map(([name, profile]) => [name, normalizeProfile(profile)]),
  );

  return {
    activeProfile: parsed.activeProfile ?? DEFAULT_PROFILE,
    profiles,
  };
}

export function writeConfig(config: CliConfig): void {
  const filePath = configPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + "\n");
  fs.chmodSync(filePath, 0o600);
}

export function getProfile(config: CliConfig, profile: string): ProfileConfig {
  return config.profiles[profile] ?? {};
}

export function saveProfile(
  config: CliConfig,
  profile: string,
  update: {
    token?: string;
    baseUrl?: string;
    timeoutMs?: number;
    name?: string;
    companyName?: string;
  },
): CliConfig {
  const existing = getProfile(config, profile);
  const merged: ProfileConfig = { ...existing, ...update };

  return {
    activeProfile: profile,
    profiles: {
      ...config.profiles,
      [profile]: merged,
    },
  };
}

export function removeProfile(config: CliConfig, profile: string): CliConfig {
  if (!(profile in config.profiles)) return config;

  const profiles = { ...config.profiles };
  delete profiles[profile];

  return {
    activeProfile: config.activeProfile === profile ? DEFAULT_PROFILE : config.activeProfile,
    profiles,
  };
}

export function resolveRuntimeOptions(config: CliConfig, overrides: RuntimeOverrideOptions): RuntimeOptions {
  const profile = overrides.profile || process.env.OPERATELY_PROFILE || config.activeProfile || DEFAULT_PROFILE;
  const profileData = getProfile(config, profile);

  const token = overrides.token || process.env.OPERATELY_API_TOKEN || profileData.token || null;
  const baseUrl = overrides.baseUrl || process.env.OPERATELY_BASE_URL || profileData.baseUrl || DEFAULT_BASE_URL;
  const timeoutMs = profileData.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return { token, baseUrl, profile, timeoutMs };
}

function normalizeProfile(profile: unknown): ProfileConfig {
  const input = (profile ?? {}) as ProfileConfig;

  return {
    token: input.token,
    baseUrl: input.baseUrl,
    timeoutMs: input.timeoutMs,
    name: input.name,
    companyName: input.companyName,
  };
}
