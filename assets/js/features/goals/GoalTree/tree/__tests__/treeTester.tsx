import { buildTree, TreeOptions, Node } from "@/features/goals/GoalTree/tree";
import { projectMock, goalMock } from "@/__tests__/mocks";

import { Space } from "@/models/spaces";
import { Person } from "@/models/people";

type ParentId = string | null;

export class TreeTester {
  private goals: any[];
  private projects: any[];
  private display: string[];
  private options: TreeOptions;

  private defaultOpts = {
    sortColumn: "name",
    sortDirection: "asc",
    showCompleted: false,
    showActive: true,
    showPaused: false,
    showGoals: true,
    showProjects: true,
  } as TreeOptions;

  constructor(display: string[] = ["name"], options: any = {}) {
    this.goals = [];
    this.projects = [];
    this.display = display;
    this.options = { ...this.defaultOpts, ...options };
  }

  addGoal(name: string, space: Space, champion: Person, parentId: ParentId = null, options: any = {}) {
    this.goals.push(goalMock(name, space, champion, { parentGoalId: parentId, ...options }));
  }

  addProj(name: string, space: Space, champion: Person, parentId: ParentId = null, options: any = {}) {
    this.projects.push(projectMock(name, space, champion, { goal: { id: parentId }, ...options }));
  }

  assertShape(expected: string) {
    const tree = buildTree(this.goals, this.projects, this.options);

    assertTreeShape(tree, this.display, expected);
  }
}

export function assertTreeShape(nodes: Node[], fields: string[], expected: string): void {
  const actual = drawTree(nodes, fields);

  const actualLines = actual.split("\n");
  const expectedLines = removeIndentation(expected).split("\n");

  const same = actualLines.length === expectedLines.length && actualLines.every((line, i) => line === expectedLines[i]);

  try {
    expect(same).toBe(true);
  } catch (e) {
    e.message += `\n\nExpected:\n${expectedLines.join("\n")}\n\nActual:\n${actualLines.join("\n")}`;
    Error.captureStackTrace(e, assertTreeShape);
    throw e;
  }
}

function drawTree(nodes: Node[], keys: string[], depth = 0): string {
  return nodes
    .map((node) => {
      const indent = "  ".repeat(depth);
      const keyValues = keys
        .map((key) => {
          if (key === "champion") return `${node.champion?.fullName}`;
          if (key === "name") return `${node.name}`;
          if (key === "space") return `${node.space?.name}`;

          throw new Error(`Unknown key: ${key}`);
        })
        .join(" ");

      if (node.children.length === 0) {
        return `${indent}${keyValues}`;
      } else {
        const children = drawTree(node.children, keys, depth + 1);
        return `${indent}${keyValues}\n${children}`;
      }
    })
    .join("\n");
}

function removeIndentation(str: string): string {
  const noEmptyLines = str
    .split("\n")
    .filter((s) => !/^\s*$/.test(s))
    .join("\n");

  const sharedPaddingSize: number = noEmptyLines
    .split("\n")
    .map((s) => s.match(/^[ ]*/)?.[0].length as number)
    .reduce((a: number, b: number) => Math.min(a, b), 1000);

  return noEmptyLines
    .split("\n")
    .map((line) => line.slice(sharedPaddingSize).trimEnd())
    .join("\n");
}
