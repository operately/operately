import React from "react";
import PrivacyLevel from "./PrivacyLevel";
import AccessLevel from "./AccessLevel";


export enum PermissionLevels {
  FULL_ACCESS=100,
  EDIT_ACCESS=70,
  COMMENT_ACCESS=40,
  VIEW_ACCESS=10,
  NO_ACCESS=0,
};


export function PermissionSelector() {
  return (
    <>
      <PrivacyLevel />
      <AccessLevel />
    </>
  )
}


