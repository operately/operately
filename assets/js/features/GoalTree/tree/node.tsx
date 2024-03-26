import type { SortColumn, SortDirection } from "./";

import * as People from "@/models/people";
import * as Groups from "@/models/groups";

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
  space: Groups.Group;

  childrenInfoLabel(): string | null;
  compare(b: Node, column: SortColumn, direction: SortDirection): number;
}
