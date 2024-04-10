import { buildTree } from "./index";

import { assertTreeShape } from "@/__tests__/utils/assertTreeShape";
import { projectMock, personMock, spaceMock, goalMock } from "@/__tests__/mocks";

describe("Tree", () => {
  const john = personMock("John");
  const peter = personMock("Peter");
  const sarah = personMock("Sarah");

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

  it("is able to hide/show completed goals", () => {
    const g1 = goalMock("G1", company, john);
    const g2 = goalMock("G2", marketing, sarah, { parentGoalId: g1.id });
    const g3 = goalMock("G3", marketing, john, { parentGoalId: g2.id, isClosed: true });
    const g4 = goalMock("G4", marketing, john, { parentGoalId: g3.id });

    const p1 = projectMock("P1", marketing, john, { goal: g1 });
    const p2 = projectMock("P2", marketing, john, { goal: g1, closedAt: new Date() });

    const withCompleted = buildTree([g1, g2, g3, g4], [p1, p2], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: true,
    });

    const withoutCompleted = buildTree([g1, g2, g3, g4], [p1, p2], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
    });

    const expectedWithCompleted = `
      G1
        G2
          G3
            G4
        P1
        P2
    `;

    const expectedWithoutCompleted = `
      G1
        G2
        P1
      G4
    `;

    assertTreeShape(withCompleted, ["name"], expectedWithCompleted);
    assertTreeShape(withoutCompleted, ["name"], expectedWithoutCompleted);
  });

  it("completed work are always on the bottom", () => {
    const g1 = goalMock("G1", company, john);
    const g2 = goalMock("G2", company, john, { isClosed: true });
    const g3 = goalMock("G3", company, john);

    const p1 = projectMock("P1", marketing, john, { goal: g1 });
    const p2 = projectMock("P2", marketing, john, { goal: g1, closedAt: new Date() });
    const p3 = projectMock("P3", marketing, john, { goal: g1 });

    const withCompleted = buildTree([g1, g2, g3], [p1, p2, p3], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: true,
    });

    const expected = `
      G1
        P1
        P3
        P2
      G3
      G2
    `;

    assertTreeShape(withCompleted, ["name"], expected);
  });
});
