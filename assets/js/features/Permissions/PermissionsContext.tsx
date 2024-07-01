import React, { Dispatch, ReactNode, createContext, useContext, useReducer } from "react"
import { PermissionLevels } from ".";

interface ContextType {
  companyName: string;
  permissions: Permissions;
  dispatch: Dispatch<ActionOptions>;
}

interface Props {
  children: NonNullable<ReactNode>;
  companyName: string;
}

export enum ReducerActions {
  SET_PUBLIC,
  SET_INTERNAL,
  SET_CONFIDENTIAL,
  SET_INTERNET_ACCESS,
  SET_COMPANY_ACCESS,
}

type ActionOptions = { type: ReducerActions.SET_PUBLIC } |
  { type: ReducerActions.SET_INTERNAL } |
  { type: ReducerActions.SET_CONFIDENTIAL } |
  { type: ReducerActions.SET_INTERNET_ACCESS, access_level: PermissionLevels } |
  { type: ReducerActions.SET_COMPANY_ACCESS, access_level: PermissionLevels }

interface Permissions {
  internet: PermissionLevels;
  company: PermissionLevels;
  space: PermissionLevels;
  project: PermissionLevels;
  goal: PermissionLevels;
}


const DEFAULT_PERMISSIONS = {
  internet: PermissionLevels.NO_ACCESS,
  company: PermissionLevels.NO_ACCESS,
  space: PermissionLevels.NO_ACCESS,
  project: PermissionLevels.NO_ACCESS,
  goal: PermissionLevels.NO_ACCESS,
};


function reducerFunction(state: Permissions, action: ActionOptions) {
  switch (action.type) {
    case ReducerActions.SET_PUBLIC:
      return {
        ...state,
        company: PermissionLevels.VIEW_ACCESS,
        internet: PermissionLevels.VIEW_ACCESS,
      };
    case ReducerActions.SET_INTERNAL:
      return {
        ...state,
        company: PermissionLevels.VIEW_ACCESS,
        internet: PermissionLevels.NO_ACCESS,
      };
    case ReducerActions.SET_CONFIDENTIAL:
      return {
        ...state,
        ...DEFAULT_PERMISSIONS,
      };
    case ReducerActions.SET_INTERNET_ACCESS:
      return {
        ...state,
        internet: action.access_level,
      };
    case ReducerActions.SET_COMPANY_ACCESS:
      return {
        ...state,
        company: action.access_level,
      };
  }
}


function PermissionsProvider({children, companyName}: Props) {
  const [permissions, dispatch] = useReducer(reducerFunction, {...DEFAULT_PERMISSIONS});

  const data = {
    companyName,
    permissions,
    dispatch,
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