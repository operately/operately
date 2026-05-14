export const INTERNAL_API_BASE_PATH = "/api/v2";
export const EXTERNAL_API_BASE_PATH = "/api/external/v1";

export const cliAuth = {
  authPassword: "/cli_auth/auth_password",
  startGoogle: "/cli_auth/start_google",
  status: "/cli_auth/status",
  createToken: "/cli_auth/create_token",
};

export function internalApiUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${INTERNAL_API_BASE_PATH}${normalizedPath}`;
}

export function externalApiUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === EXTERNAL_API_BASE_PATH || normalizedPath.startsWith(`${EXTERNAL_API_BASE_PATH}/`)) {
    return `${normalizedBase}${normalizedPath}`;
  }

  return `${normalizedBase}${EXTERNAL_API_BASE_PATH}${normalizedPath}`;
}
