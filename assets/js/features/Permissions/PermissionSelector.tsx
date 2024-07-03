import React from "react";
import PrivacyLevel from "./PrivacyLevel";
import AccessLevel from "./AccessLevel";


export function SpacePermissionSelector() {
  return (
    <>
      <PrivacyLevel description="Who can view information in this space?" />
      <AccessLevel />
    </>
  )
}
