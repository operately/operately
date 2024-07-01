import React from "react";
import PrivacyLevel from "./PrivacyLevel";
import AccessLevel from "./AccessLevel";


export function PermissionSelector() {
  return (
    <>
      <PrivacyLevel />
      <AccessLevel />
    </>
  )
}
