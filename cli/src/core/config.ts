// Re-export from auth/config.ts for backward compatibility.
// Auth config is auth-profile-specific and lives under auth/.
export {
  DEFAULT_BASE_URL,
  configPath,
  defaultConfig,
  readConfig,
  writeConfig,
  getProfile,
  saveProfile,
  removeProfile,
  resolveRuntimeOptions,
  type CliConfig,
  type ProfileConfig,
  type RuntimeOptions,
  type RuntimeOverrideOptions,
} from "../auth/config";
