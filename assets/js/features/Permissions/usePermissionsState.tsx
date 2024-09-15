import React from "react";
import { Space } from "@/models/spaces";
import { Company } from "@/models/companies";
import { PermissionLevels } from ".";
import { AccessLevels } from "@/api";

export enum ReducerActions {
  SET_PUBLIC,
  SET_INTERNAL,
  SET_CONFIDENTIAL,
  SET_SECRET,
  SET_PUBLIC_ACCESS,
  SET_COMPANY_ACCESS,
  SET_SPACE_ACCESS,
  SET_ALL,
}

type ActionOptions =
  | { type: ReducerActions.SET_PUBLIC }
  | { type: ReducerActions.SET_INTERNAL }
  | { type: ReducerActions.SET_CONFIDENTIAL }
  | { type: ReducerActions.SET_SECRET }
  | { type: ReducerActions.SET_PUBLIC_ACCESS; access_level: PermissionLevels }
  | { type: ReducerActions.SET_COMPANY_ACCESS; access_level: PermissionLevels }
  | { type: ReducerActions.SET_SPACE_ACCESS; access_level: PermissionLevels }
  | { type: ReducerActions.SET_ALL; payload: Permissions };

export interface Permissions {
  public: PermissionLevels;
  company: PermissionLevels;
  space: PermissionLevels;
}

const DEFAULT_PERMISSIONS = {
  public: PermissionLevels.NO_ACCESS,
  company: PermissionLevels.EDIT_ACCESS,
  space: PermissionLevels.EDIT_ACCESS,
};

function reducerFunction(state: Permissions, action: ActionOptions) {
  switch (action.type) {
    case ReducerActions.SET_PUBLIC:
      return {
        space: PermissionLevels.EDIT_ACCESS,
        company: PermissionLevels.EDIT_ACCESS,
        public: PermissionLevels.VIEW_ACCESS,
      };
    case ReducerActions.SET_INTERNAL:
      return {
        space: PermissionLevels.EDIT_ACCESS,
        company: PermissionLevels.EDIT_ACCESS,
        public: PermissionLevels.NO_ACCESS,
      };
    case ReducerActions.SET_CONFIDENTIAL:
      return {
        space: PermissionLevels.EDIT_ACCESS,
        company: PermissionLevels.NO_ACCESS,
        public: PermissionLevels.NO_ACCESS,
      };
    case ReducerActions.SET_SECRET:
      return {
        space: PermissionLevels.NO_ACCESS,
        company: PermissionLevels.NO_ACCESS,
        public: PermissionLevels.NO_ACCESS,
      };

    case ReducerActions.SET_PUBLIC_ACCESS:
      return {
        ...state,
        public: action.access_level,
      };
    case ReducerActions.SET_COMPANY_ACCESS:
      return {
        ...state,
        company: action.access_level,
      };
    case ReducerActions.SET_SPACE_ACCESS:
      return {
        ...state,
        space: action.access_level,
      };

    case ReducerActions.SET_ALL:
      return {
        ...action.payload,
      };
  }
}

interface UsePermissionsStateProps {
  company: Company;
  space?: Space | null;
  currentPermissions?: AccessLevels | null;
}

export interface PermissionsState {
  company: Company;
  permissions: Permissions;
  hasPermissions: boolean;
  dispatch: React.Dispatch<ActionOptions>;
  space?: Space | null;
}

export function usePermissionsState(props: UsePermissionsStateProps): PermissionsState {
  const [permissions, dispatch] = React.useReducer(
    reducerFunction,
    props.currentPermissions ? ({ ...props.currentPermissions } as Permissions) : { ...DEFAULT_PERMISSIONS },
  );

  const data = {
    company: props.company,
    space: props.space,
    permissions,
    dispatch,
    hasPermissions: Boolean(props.currentPermissions),
  };

  return data;
}
