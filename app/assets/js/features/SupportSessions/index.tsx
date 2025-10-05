import React from "react";

const SUPPORT_SESSION_COOKIE_NAME = "support_session_token";

export function getSupportSessionCookie(): string | undefined {
  const cookie = document.cookie
    .split(";")
    .find((cookie) => cookie.trim().startsWith(`${SUPPORT_SESSION_COOKIE_NAME}=`));

  return cookie ? cookie.split("=")[1] : undefined;
}

export function hasSupportSessionCookie(): boolean {
  return getSupportSessionCookie() !== undefined;
}

export function useEndSupportSession() {
  const handleEndSession = React.useCallback(async () => {
    try {
      const response = await fetch("/admin/api/support-session/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.redirect_url;
      } else {
        console.error("Failed to end support session");
      }
    } catch (error) {
      console.error("Error ending support session:", error);
    }
  }, []);

  return handleEndSession;
}

export function useHasSupportSessionCookie() {
  const [hasCookie, setHasCookie] = React.useState(hasSupportSessionCookie());

  React.useEffect(() => {
    const checkCookie = () => {
      setHasCookie(hasSupportSessionCookie());
    };

    checkCookie();

    // Check periodically in case cookie expires
    const interval = setInterval(checkCookie, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return hasCookie;
}

export function useStartSupportSession(companyId: string) {
  const [starting, setStarting] = React.useState(false);

  const start = React.useCallback(async () => {
    try {
      setStarting(true);

      const response = await fetch("/admin/api/support-session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start support session");
      }

      const data = await response.json();
      window.location.href = data.redirect_url;
    } catch (error) {
      console.error("Error starting support session:", error);
      // Handle error (show notification, etc.)
    } finally {
      setStarting(false);
    }
  }, [companyId]);

  return { startSupportSession: start, supportSessionStarting: starting };
}
