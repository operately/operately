import { buildTree, TreeOptions } from "./index";

import { assertTreeShape } from "@/__tests__/utils/assertTreeShape";
import { projectMock, personMock, spaceMock, goalMock } from "@/__tests__/mocks";

describe("Tree", () => {
  const john = personMock("John");
  const peter = personMock("Peter");
  const sarah = personMock("Sarah");

  const company = spaceMock("Company");
  const product = spaceMock("Product");
  const marketing = spaceMock("Marketing");

  const defaultOpts = {
    sortColumn: "name",
    sortDirection: "asc",
    showCompleted: false,
    showActive: true,
    showPaused: false,
  } as TreeOptions;

  it("can display the full three recursivly", () => {
    const g1 = goalMock("G1", company, john);
    const g11 = goalMock("G11", marketing, sarah, { parentGoalId: g1.id });
    const g111 = goalMock("G111", marketing, john, { parentGoalId: g11.id });

    const tree = buildTree([g1, g11, g111], [], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
      showActive: true,
      showPaused: false,
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
      showActive: true,
      showPaused: false,
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
      showActive: true,
      showPaused: false,
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

  describe("filtering by space", () => {
    it("shows only goals from the selected space", () => {
      const goals = [
        goalMock("G1", marketing, john),
        goalMock("G2", product, sarah),
        goalMock("G3", company, john),
        goalMock("G31", marketing, john, { parentGoalId: "G3" }),
        goalMock("G32", product, sarah, { parentGoalId: "G3" }),
      ];

      const tree = buildTree(goals, [], { ...defaultOpts, spaceId: marketing.id! });

      const expected = `
        G1 Marketing
        G3 Company
          G31 Marketing
      `;

      assertTreeShape(tree, ["name", "space"], expected);
    });

    it("displays descendants of a goal from other spaces", () => {
      const goals = [
        goalMock("G1", marketing, peter),
        goalMock("G11", product, sarah, { parentGoalId: "G1" }),
        goalMock("G111", product, sarah, { parentGoalId: "G11" }),
      ];

      const tree = buildTree(goals, [], { ...defaultOpts, spaceId: marketing.id! });
      const expected = `
        G1 Marketing
          G11 Product
            G111 Product
      `;

      assertTreeShape(tree, ["name", "space"], expected);
    });

    it("displays ancestors of a goal from other spaces", () => {
      const goals = [
        goalMock("G1", company, john),
        goalMock("G11", product, john, { parentGoalId: "G1" }),
        goalMock("G111", marketing, sarah, { parentGoalId: "G11" }),
      ];

      const tree = buildTree(goals, [], { ...defaultOpts, spaceId: marketing.id! });

      const expected = `
        G1 Company
          G11 Product
            G111 Marketing
      `;

      assertTreeShape(tree, ["name", "space"], expected);
    });
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
      personId: john.id!,
      showActive: true,
      showPaused: false,
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
      showActive: true,
      showPaused: false,

      goalId: g2.id!,
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
    const p2 = projectMock("P2", marketing, john, { goal: g1, status: "closed" });

    const g5 = goalMock("G5", company, john, { isClosed: true });

    const withCompleted = buildTree([g1, g2, g3, g4, g5], [p1, p2], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: true,
      showActive: true,
      showPaused: false,
    });

    const withoutCompleted = buildTree([g1, g2, g3, g4, g5], [p1, p2], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
      showActive: true,
      showPaused: false,
    });

    const expectedWithCompleted = `
      G1
        G2
          G3
            G4
        P1
        P2
      G5
    `;

    const expectedWithoutCompleted = `
      G1
        G2
        P1
    `;

    assertTreeShape(withCompleted, ["name"], expectedWithCompleted);
    assertTreeShape(withoutCompleted, ["name"], expectedWithoutCompleted);
  });

  it("is hides uncompleted subgoals when parent is completed", () => {
    const g1 = goalMock("G1", company, john);
    const g2 = goalMock("G2", marketing, sarah, { parentGoalId: g1.id, isClosed: true });
    const g3 = goalMock("G3", marketing, john, { parentGoalId: g2.id });

    const tree = buildTree([g1, g2, g3], [], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
      showActive: true,
      showPaused: false,
    });

    const expected = `
      G1
    `;

    assertTreeShape(tree, ["name"], expected);
  });

  it("completed work are always on the bottom", () => {
    const g1 = goalMock("G1", company, john);
    const g2 = goalMock("G2", company, john, { isClosed: true });
    const g3 = goalMock("G3", company, john);

    const p1 = projectMock("P1", marketing, john, { goal: g1 });
    const p2 = projectMock("P2", marketing, john, { goal: g1, status: "closed" });
    const p3 = projectMock("P3", marketing, john, { goal: g1 });

    const withCompleted = buildTree([g1, g2, g3], [p1, p2, p3], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: true,
      showActive: true,
      showPaused: false,
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

  it("can sort nodes by name asc/desc", () => {
    const g1 = goalMock("A", company, john);
    const g2 = goalMock("B", company, john);
    const g3 = goalMock("C", company, john);

    const g11 = goalMock("D", company, john, { parentGoalId: g1.id });
    const g12 = goalMock("E", company, john, { parentGoalId: g1.id });
    const g13 = goalMock("F", company, john, { parentGoalId: g1.id });

    const treeAsc = buildTree([g1, g2, g3, g11, g12, g13], [], {
      sortColumn: "name",
      sortDirection: "asc",
      showCompleted: false,
      showActive: true,
      showPaused: false,
    });

    const treeDesc = buildTree([g1, g2, g3, g11, g12, g13], [], {
      sortColumn: "name",
      sortDirection: "desc",
      showCompleted: false,
      showActive: true,
      showPaused: false,
    });

    const expectedAsc = `
      A
        D
        E
        F
      B
      C
    `;

    const expectedDesc = `
      C
      B
      A
        F
        E
        D
    `;

    assertTreeShape(treeAsc, ["name"], expectedAsc);
    assertTreeShape(treeDesc, ["name"], expectedDesc);
  });
});
