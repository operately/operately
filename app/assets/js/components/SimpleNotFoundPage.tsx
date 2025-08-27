import React from "react";
import { GhostButton } from "turboui";

/**
 * Simple 404 page component that doesn't require company context.
 * Used when 404 errors occur outside of company routes.
 */
export function SimpleNotFoundPage() {
  return (
    <div className="absolute inset-0 flex justify-center items-center gap-16">
      <div className="flex flex-col text-center -mt-64">
        <div className="font-extrabold" style={{ fontSize: "10rem" }}>
          404
        </div>
        <div className="text-3xl font-bold mt-4">Page Not Found</div>
        <div className="text-lg font-medium my-4">Sorry, we couldn't find that page you were looking for.</div>

        <div className="flex w-full justify-center mt-4">
          <GhostButton linkTo="/" testId="back-to-lobby">
            Go back to Home
          </GhostButton>
        </div>
      </div>
    </div>
  );
}