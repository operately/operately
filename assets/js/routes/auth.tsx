type LogOutResult = "success" | "failure";
type LogInResult = "success" | "failure";

export async function logOut(): Promise<LogOutResult> {
  const res = await fetch("/accounts/log_out", { method: "DELETE", headers: autheaders() });

  return res.status === 200 ? "success" : "failure";
}

interface LogInOptions {
  redirectTo: string | null;
}

export async function logIn(email: string, password: string, options: LogInOptions): Promise<LogInResult> {
  const data = { email, password };

  const res = await fetch("/accounts/log_in", { method: "POST", headers: autheaders(), body: JSON.stringify(data) });

  if (res.status === 200) {
    if (options.redirectTo) {
      window.location.href = options.redirectTo;
    } else if (res.redirected) {
      window.location.href = res.url;
    } else {
      window.location.href = "/";
    }

    return "success";
  } else {
    return "failure";
  }
}

function autheaders(): HeadersInit {
  const csrfToken = document.querySelector<HTMLMetaElement>("meta[name=csrf-token]")?.content;

  return {
    "x-csrf-token": csrfToken,
    "Content-Type": "application/json",
  } as HeadersInit;
}
