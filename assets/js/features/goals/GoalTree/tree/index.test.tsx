import { buildTree } from "./index";

import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { Group } from "@/models/groups";
import { Person } from "@/models/people";

import { Node } from "./node";

describe("Tree", () => {
  let people: Record<string, Person>;
  let spaces: Record<string, Group>;
  let goals: Goal[];
  let projects: Project[];

  beforeEach(() => {
    const john = personMock("John");
    const peter = personMock("Peter");
    const sarah = personMock("Sarah");

    const company = spaceMock("Company");
    const mkt = spaceMock("Marketing");
    const product = spaceMock("Product");

    const cg1 = goalMock("CompanyGoal1", company, john);
    const cg2 = goalMock("CompanyGoal2", company, peter);
    const cg3 = goalMock("CompanyGoal3", company, sarah);

    const mg1 = goalMock("MarketingGoal1", mkt, sarah, { parentGoalId: cg1.id });
    const mg11 = goalMock("MarketingGoal1.1", mkt, john, { parentGoalId: mg1.id });

    const mg2 = goalMock("MarketingGoal2", mkt, john);

    const pg1 = goalMock("ProductGoal1", product, john, { parentGoalId: cg3.id });

    people = { john, peter, sarah };
    spaces = { company, mkt, product };
    goals = [cg1, cg2, cg3, mg1, mg11, mg2, pg1];
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
        ProductGoal1
      MarketingGoal2
    `;

    assertTreeShape(tree, ["name"], expected);
  });

  it("can display goals belonging to a space", () => {
    const tree = buildTree(goals, projects, {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
      spaceId: spaces.mkt!.id,
    });

    const expected = `
      MarketingGoal1 Marketing
        MarketingGoal1.1 Marketing
      MarketingGoal2 Marketing
    `;

    assertTreeShape(tree, ["name", "space"], expected);
  });

  it("is able to select goals for a person", () => {
    const tree = buildTree(goals, projects, {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
      personId: people.john!.id,
    });

    const expected = `
      CompanyGoal1 John
        MarketingGoal1 Sarah
          MarketingGoal1.1 John
      MarketingGoal2 John
      ProductGoal1 John
    `;

    assertTreeShape(tree, ["name", "champion"], expected);
  });

  it("is able to select subgoals for a goal", () => {
    const tree = buildTree(goals, projects, {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,

      goalId: goals[0]!.id,
    });

    const expected = `
      MarketingGoal1
        MarketingGoal1.1
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
    .map((line) => line.slice(sharedPaddingSize))
    .join("\n");
}
