import * as React from "react";

interface Person {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface Context {
  editor: any;
  linkEditActive: boolean;
  setLinkEditActive: (active: boolean) => void;
  findPerson: (id: string) => Person | null;
}

export const EditorContext = React.createContext<Context>({} as Context);

export function usePerson(id: string): Person | null {
  return React.useContext(EditorContext).findPerson(id);
}
