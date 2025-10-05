import React from "react";
import { IconCircleKey, SecondaryButton } from "turboui";

export function SupportSessionBanner() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Check for support session cookie
    const checkCookie = () => {
      const hasSupportSessionCookie = document.cookie
        .split(";")
        .some((cookie) => cookie.trim().startsWith("support_session_token="));

      setIsVisible(hasSupportSessionCookie);
    };

    checkCookie();

    // Check periodically in case cookie expires
    const interval = setInterval(checkCookie, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleEndSession = async () => {
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
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-yellow-100 border-t border-yellow-300 px-4 py-2 z-[1000]"
      data-testid="support-session-banner"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <IconCircleKey size={20} className="text-yellow-600" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold text-yellow-800">Support Mode Active</span>
            <span className="text-sm text-yellow-700">You are viewing this account as support staff.</span>
          </div>
        </div>

        <SecondaryButton onClick={handleEndSession} size="sm" testId="end-support-session-button">
          <span className="hidden sm:inline">Exit Support Mode</span>
        </SecondaryButton>
      </div>
    </div>
  );
}
