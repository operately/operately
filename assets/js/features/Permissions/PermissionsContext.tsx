import React, { Dispatch, ReactNode, createContext, useContext, useReducer } from "react"
import { Space } from "@/models/spaces";
import { Company } from "@/models/companies";
import { PermissionLevels } from ".";
import { AccessLevels } from "@/api";

interface ContextType {
  company: Company;
  permissions: Permissions;
  hasPermissions: boolean;
  dispatch: Dispatch<ActionOptions>;
  space?: Space | null;
}

interface Props {
  children: NonNullable<ReactNode>;
  company: Company;
  space?: Space | null;
  currentPermissions?: AccessLevels | null;
}

export enum ReducerActions {
  SET_PUBLIC,
  SET_INTERNAL,
  SET_CONFIDENTIAL,
  SET_SECRET,
  SET_PUBLIC_ACCESS,
  SET_COMPANY_ACCESS,
  SET_SPACE_ACCESS,
}

type ActionOptions = { type: ReducerActions.SET_PUBLIC } |
  { type: ReducerActions.SET_INTERNAL } |
  { type: ReducerActions.SET_CONFIDENTIAL } |
  { type: ReducerActions.SET_SECRET } |
  { type: ReducerActions.SET_PUBLIC_ACCESS, access_level: PermissionLevels } |
  { type: ReducerActions.SET_COMPANY_ACCESS, access_level: PermissionLevels } |
  { type: ReducerActions.SET_SPACE_ACCESS, access_level: PermissionLevels }


export interface Permissions {
  public: PermissionLevels;
  company: PermissionLevels;
  space: PermissionLevels;
}


const DEFAULT_PERMISSIONS = {
  public: PermissionLevels.NO_ACCESS,
  company: PermissionLevels.NO_ACCESS,
  space: PermissionLevels.NO_ACCESS,
};


function reducerFunction(state: Permissions, action: ActionOptions) {
  switch (action.type) {
    case ReducerActions.SET_PUBLIC:
      return {
        space: PermissionLevels.VIEW_ACCESS,
        company: PermissionLevels.VIEW_ACCESS,
        public: PermissionLevels.VIEW_ACCESS,
      };
    case ReducerActions.SET_INTERNAL:
      return {
        space: PermissionLevels.VIEW_ACCESS,
        company: PermissionLevels.VIEW_ACCESS,
        public: PermissionLevels.NO_ACCESS
      };
    case ReducerActions.SET_CONFIDENTIAL:
      return {
        ...DEFAULT_PERMISSIONS,
        space: PermissionLevels.VIEW_ACCESS,
      };
    case ReducerActions.SET_SECRET:
      return {
        ...DEFAULT_PERMISSIONS,
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
  }
}


function PermissionsProvider({children, company, space, currentPermissions}: Props) {
  const [permissions, dispatch] = useReducer(reducerFunction, currentPermissions ? ({...currentPermissions} as Permissions) : {...DEFAULT_PERMISSIONS});

  const data = {
    company,
    space,
    permissions,
    dispatch,
    hasPermissions: Boolean(currentPermissions),
  }

  return (
    <PermissionsContext.Provider value={data}>
      {children}
    </PermissionsContext.Provider>
  )
}


const PermissionsContext = createContext<ContextType | undefined>(undefined);


function usePermissionsContext() {
  const context = useContext(PermissionsContext);

  if (context === undefined) {
      throw Error('usePermissionsContext must be used within a PermissionsProvider');
  }

  return context;
}

export {
  PermissionsProvider,
  usePermissionsContext,
}