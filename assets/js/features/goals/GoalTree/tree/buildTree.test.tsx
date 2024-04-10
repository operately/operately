import { buildTree } from "./index";

import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { Group } from "@/models/groups";
import { Person } from "@/models/people";

import { Node } from "./node";

describe("Tree", () => {
  const john: Person = personMock("John");
  const peter: Person = personMock("Peter");
  const sarah: Person = personMock("Sarah");

  const company = spaceMock("Company");
  const product = spaceMock("Product");
  const marketing = spaceMock("Marketing");

  it("can display the full three recursivly", () => {
    const g1 = goalMock("G1", company, john);
    const g11 = goalMock("G11", marketing, sarah, { parentGoalId: g1.id });
    const g111 = goalMock("G111", marketing, john, { parentGoalId: g11.id });

    const tree = buildTree([g1, g11, g111], [], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
    });

    const expected = `
      G1
        G11
          G111
    `;

    assertTreeShape(tree, ["name"], expected);
  });

  it("can display multiple roots", () => {
    const g1 = goalMock("G1", company, john);
    const g11 = goalMock("G11", marketing, sarah, { parentGoalId: g1.id });
    const g2 = goalMock("G2", company, peter);
    const g21 = goalMock("G21", marketing, john, { parentGoalId: g2.id });

    const tree = buildTree([g1, g11, g2, g21], [], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
    });

    const expected = `
      G1
        G11
      G2
        G21
    `;

    assertTreeShape(tree, ["name"], expected);
  });

  it("can show projects in the tree", () => {
    const g1 = goalMock("G1", company, john);
    const g11 = goalMock("G11", marketing, sarah, { parentGoalId: g1.id });
    const p1 = projectMock("P1", company, john, { goal: g1 });

    const g2 = goalMock("G2", company, peter);
    const g21 = goalMock("G21", marketing, john, { parentGoalId: g2.id });
    const p2 = projectMock("P2", company, peter, { goal: g2 });

    const tree = buildTree([g1, g11, g2, g21], [p1, p2], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
    });

    const expected = `
      G1
        G11
        P1
      G2
        G21
        P2
    `;

    assertTreeShape(tree, ["name"], expected);
  });

  it("can display goals belonging to a space", () => {
    const g1 = goalMock("G1", company, john);
    const g11 = goalMock("G11", marketing, sarah, { parentGoalId: g1.id });

    const g2 = goalMock("G2", company, peter);
    const g21 = goalMock("G21", marketing, sarah, { parentGoalId: g2.id });
    const g211 = goalMock("G211", marketing, sarah, { parentGoalId: g21.id });

    const tree = buildTree([g1, g11, g2, g21, g211], [], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
      spaceId: marketing.id,
    });

    const expected = `
      G11 Marketing
      G21 Marketing
        G211 Marketing
    `;

    assertTreeShape(tree, ["name", "space"], expected);
  });

  it("displays descendants of a goal from other spaces when showing goals for a space", () => {
    const g1 = goalMock("G1", company, john);
    const g11 = goalMock("G11", marketing, sarah, { parentGoalId: g1.id });

    const g2 = goalMock("G2", marketing, peter);
    const g21 = goalMock("G21", product, sarah, { parentGoalId: g2.id });
    const g211 = goalMock("G211", product, sarah, { parentGoalId: g21.id });

    const tree = buildTree([g1, g11, g2, g21, g211], [], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
      spaceId: marketing.id,
    });

    const expected = `
      G11 Marketing
      G2 Marketing
        G21 Product
          G211 Product
    `;

    assertTreeShape(tree, ["name", "space"], expected);
  });

  it("is able to select goals and projects for a person", () => {
    const g1 = goalMock("G1", company, john);
    const g11 = goalMock("G11", marketing, sarah, { parentGoalId: g1.id });

    const g2 = goalMock("G2", marketing, peter);
    const g21 = goalMock("G21", product, sarah, { parentGoalId: g2.id });
    const g211 = goalMock("G211", product, john, { parentGoalId: g21.id });

    const p1 = projectMock("P1", product, john, { goal: g2 });

    const tree = buildTree([g1, g11, g2, g21, g211], [p1], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
      personId: john.id,
    });

    const expected = `
      G1 John
        G11 Sarah
      G211 John
      P1 John
    `;

    assertTreeShape(tree, ["name", "champion"], expected);
  });

  it("is able to select subgoals and projects for a goal", () => {
    const g1 = goalMock("G1", company, john);
    const g2 = goalMock("G2", marketing, sarah, { parentGoalId: g1.id });
    const g3 = goalMock("G3", marketing, john, { parentGoalId: g2.id });
    const g4 = goalMock("G4", marketing, john, { parentGoalId: g3.id });

    const p1 = projectMock("P1", marketing, john, { goal: g2 });

    const tree = buildTree([g1, g2, g3, g4], [p1], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,

      goalId: g2.id,
    });

    const expected = `
      G3
        G4
      P1
    `;

    assertTreeShape(tree, ["name"], expected);
  });

  // it("is able to hide/show completed goals", () => {
  //   const companySpace = { id: "1" };
  //   const marketingSpace = { id: "2" };
  //   const productSpace = { id: "3" };

  //   const allGoals = [
  //     goalForSpace(companySpace, "A", null, false),
  //     goalForSpace(marketingSpace, "B", "A"),
  //     goalForSpace(marketingSpace, "C", "A"),
  //     goalForSpace(marketingSpace, "D", "B", true),
  //     goalForSpace(marketingSpace, "E", "D", true),
  //     goalForSpace(productSpace, "F", "A"),
  //     goalForSpace(marketingSpace, "G", "F"),
  //     goalForSpace(marketingSpace, "H", null, true),
  //   ] as Goal[];

  //   const filters: TreeOptions = {
  //     sortColumn: "name",
  //     sortDirection: "asc",
  //     showCompleted: false,
  //   };

  //   const tree = buildTree(allGoals, [], filters);

  //   expect(drawTree(tree, ["name"])).toEqual(`
  //     B
  //   `);
  // });
});

function goalMock(name: string, space: Group, champion: Person, params: Partial<Goal> = {}): Goal {
  return {
    id: name,
    name,
    spaceId: "1",
    space,
    champion,
    championId: champion.id,
    ...params,
  } as unknown as Goal;
}

function spaceMock(name: string): Group {
  return { id: name, name } as unknown as Group;
}

function personMock(name: string): Person {
  return { id: name, fullName: name } as unknown as Person;
}

function projectMock(name: string, space: Group, champion: Person, params: Partial<Project> = {}): Project {
  return {
    id: name,
    name,
    spaceId: "1",
    space,
    champion,
    championId: champion.id,
    milestones: [],
    ...params,
  } as unknown as Project;
}

function assertTreeShape(nodes: Node[], fields: string[], expected: string): void {
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
