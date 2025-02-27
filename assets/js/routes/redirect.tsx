export class RedirectError extends Error {
  constructor(
    public destination: string,
    public status: number,
  ) {
    super(`Redirecting to ${destination}`);
    this.name = "RedirectError";
  }
}

export const REDIRECT_EVENT = "redirect";

function createRedirectEvent(destination: string, status: number) {
  return new CustomEvent(REDIRECT_EVENT, {
    detail: {
      destination,
      status,
      timestamp: new Date().toISOString(),
    },
  });
}

interface RedirectOptions {
  status?: number;
  replace?: boolean;
}

export function redirect(path: string, options?: RedirectOptions) {
  const status = options?.status || 302;
  const absoluteUrl = new URL(path, window.location.href);

  if (options?.replace) {
    window.history.replaceState({}, "", absoluteUrl);
  } else {
    window.history.pushState({}, "", absoluteUrl);
  }

  const redirectEvent = createRedirectEvent(path, status);
  window.dispatchEvent(redirectEvent);

  return new RedirectError(path, status);
}
