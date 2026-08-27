import axios from "axios";

export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function loginPath(): string {
  if (window.location.pathname === "/") {
    return "/log_in";
  }

  return "/log_in?redirect_to=" + encodeURIComponent(window.location.pathname);
}
