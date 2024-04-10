import { buildTree } from "./index";

import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { Group } from "@/models/groups";

import { Node } from "./node";

describe("Tree", () => {
  let spaces: Group[];
  let goals: Goal[];
  let projects: Project[];

  beforeEach(() => {
    const company = spaceMock("Company");
    const mkt = spaceMock("Marketing");

    const cg1 = goalMock("CompanyGoal1", company);
    const cg2 = goalMock("CompanyGoal2", company);
    const cg3 = goalMock("CompanyGoal3", company);

    const mg1 = goalMock("MarketingGoal1", mkt, { parentGoalId: cg1.id });
    const mg11 = goalMock("MarketingGoal1.1", mkt, { parentGoalId: mg1.id });

    const mg2 = goalMock("MarketingGoal2", mkt);

    spaces = [company, mkt];
    goals = [cg1, cg2, cg3, mg1, mg11, mg2];
    projects = [];
  });

  it("can display the full three", () => {
    const tree = buildTree(goals, projects, {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
    });

    const expected = `
      CompanyGoal1
        MarketingGoal1
          MarketingGoal1.1
      CompanyGoal2
      CompanyGoal3
      MarketingGoal2
    `;

    assertTreeShape(tree, ["name"], expected);
  });

  it("can display goals belonging to a space", () => {
    const tree = buildTree(goals, projects, {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
      spaceId: spaces[1]!.id,
    });

    const expected = `
      MarketingGoal1
        MarketingGoal1.1
      MarketingGoal2
    `;

    assertTreeShape(tree, ["name"], expected);
  });

  // it("is able to select goals for a person", () => {
  //   const personA = { id: "1" };
  //   const personB = { id: "2" };

  //   const allGoals = [
  //     goalForPerson(personB, "A", null),
  //     goalForPerson(personA, "B", "A"),
  //     goalForPerson(personA, "C", "A"),
  //     goalForPerson(personA, "D", "B"),
  //     goalForPerson(personA, "E", "D"),
  //     goalForPerson(personA, "F", "A"),
  //     goalForPerson(personA, "G", "F"),
  //     goalForPerson(personB, "H", null),
  //   ] as Goal[];

  //   const options: TreeOptions = {
  //     sortColumn: "name",
  //     sortDirection: "asc",
  //     showCompleted: false,
  //     personId: personA.id,
  //   };

  //   const tree = buildTree(allGoals, [], options);

  //   expect(drawTree(tree, ["name"])).toEqual(`
  //     B
  //       D
  //         E
  //     C
  //   `);
  // });

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

function goalMock(name: string, space: Group, params: Partial<Goal> = {}): Goal {
  return {
    id: name,
    name,
    spaceId: "1",
    space,
    ...params,
  } as unknown as Goal;
}

function spaceMock(name: string): Group {
  return { id: name, name } as unknown as Group;
}

// function goalForSpace(
//   space: { id: string },
//   name: string,
//   parentGoalId: string | null,
//   isClosed: boolean = false,
// ): Goal {
//   return {
//     id: name,
//     name,
//     space,
//     parentGoalId,
//     title: name,
//     projects: [],
//     isClosed,
//   } as unknown as Goal;
// }

// function goalForPerson(person: { id: string }, name: string, parentGoalId: string | null): Goal {
//   return {
//     id: name,
//     name,
//     space: { id: "1" },
//     champion: person,
//     parentGoalId,
//     title: name,
//     projects: [],
//   } as unknown as Goal;
// }

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
      const keyValues = keys.map((key) => node[key]).join(", ");

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
    .map((line) => line.slice(sharedPaddingSize))
    .join("\n");
}
