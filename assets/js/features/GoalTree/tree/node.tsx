import type { SortColumn, SortDirection } from "./";

import * as People from "@/models/people";

export type NodeTypes = "goal" | "project";

export interface Node {
  id: string;
  type: NodeTypes;
  name: string;
  spaceId: string;
  champion: People.Person;
  linkTo: string;
  children: Node[];
  depth: number;
  hasChildren: boolean;
  progress: number;

  childrenInfoLabel(): string | null;
  compare(b: Node, column: SortColumn, direction: SortDirection): number;
}
