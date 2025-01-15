import { TreeTester } from "./buildTree.treeTester.test";
import { personMock, spaceMock } from "@/__tests__/mocks";

describe("Tree", () => {
  const john = personMock("John");
  const peter = personMock("Peter");
  const sarah = personMock("Sarah");

  const company = spaceMock("Company");
  const product = spaceMock("Product");
  const marketing = spaceMock("Marketing");

  it("builds a tree from goals and projects", () => {
    const t = new TreeTester();

    t.addGoal("G1", company, john);
    t.addGoal("G11", marketing, sarah, "G1");
    t.addGoal("G111", marketing, john, "G11");
    t.addProj("P1111", marketing, john, "G111");

    t.assertShape(`
      G1
        G11
          G111
            P1111
    `);
  });

  it("can display multiple roots", () => {
    const t = new TreeTester();

    t.addGoal("G1", company, john);
    t.addGoal("G11", marketing, sarah, "G1");
    t.addGoal("G2", company, john);
    t.addGoal("G21", marketing, john, "G2");

    t.assertShape(`
      G1
        G11
      G2
        G21
    `);
  });

  it("can show projects without associated goals", () => {
    const t = new TreeTester();

    t.addProj("P1", company, john);
    t.addProj("P2", marketing, sarah);

    t.assertShape(`
      P1
      P2
    `);
  });

  describe("filtering by status", () => {
    describe("showActive", () => {
      it("shows only active goals", () => {
        const t = new TreeTester(["name"], { showActive: true });

        t.addGoal("G1", company, john);
        t.addGoal("G2", company, john, null, { isClosed: true });
        t.addGoal("G3", company, john);
        t.addGoal("G4", company, john, "G3", { isClosed: true });

        t.assertShape(`
          G1
          G3
        `);
      });

      it("shows closed ancestors of active goals", () => {
        const t = new TreeTester(["name"], { showActive: true });

        t.addGoal("G1", company, john, null, { isClosed: true });
        t.addGoal("G2", company, john, "G1", { isClosed: true });
        t.addGoal("G3", company, john, "G2");

        t.assertShape(`
          G1
            G2
              G3
        `);
      });
    });

    describe("showPaused", () => {
      it("shows only paused projects", () => {
        const t = new TreeTester(["name"], { showActive: false, showPaused: true });

        t.addProj("P1", company, john, null, { status: "paused" });
        t.addProj("P2", company, john, null, { status: "active" });

        t.assertShape(`
          P1
        `);
      });

      it("shows closed ancestors of paused projects", () => {
        const t = new TreeTester(["name"], { showActive: false, showPaused: true });

        t.addGoal("G1", company, john, null, { isClosed: true });
        t.addProj("P1", company, john, "G1", { status: "paused" });
        t.addProj("P2", company, john, "G1", { status: "active" });

        t.assertShape(`
          G1
            P1
        `);
      });
    });

    describe("showCompleted", () => {
      it("shows only completed goals", () => {
        const t = new TreeTester(["name"], { showActive: false, showPaused: false, showCompleted: true });

        t.addGoal("G1", company, john, null, { isClosed: true });
        t.addGoal("G2", company, john, null, { isClosed: false });

        t.assertShape(`
          G1
        `);
      });

      it("shows active ancestors of completed goals", () => {
        const t = new TreeTester(["name"], { showActive: false, showPaused: false, showCompleted: true });

        t.addGoal("G1", company, john);
        t.addGoal("G2", company, john, "G1");
        t.addGoal("G3", company, john, "G2", { isClosed: true });

        t.assertShape(`
          G1
            G2
              G3
        `);
      });
    });
  });

  describe("filtering by space", () => {
    it("shows only goals from the selected space", () => {
      const t = new TreeTester(["name", "space"], { spaceId: marketing.id });

      t.addGoal("G1", marketing, john);
      t.addGoal("G2", product, sarah);
      t.addGoal("G3", company, john);
      t.addGoal("G31", marketing, john, "G3");
      t.addGoal("G32", product, sarah, "G3");

      t.assertShape(`
        G1 Marketing
        G3 Company
          G31 Marketing
      `);
    });

    it("displays descendants of a goal from other spaces", () => {
      const t = new TreeTester(["name", "space"], { spaceId: marketing.id });

      t.addGoal("G1", marketing, john);
      t.addGoal("G11", product, sarah, "G1");
      t.addGoal("G111", product, john, "G11");

      t.assertShape(`
        G1 Marketing
          G11 Product
            G111 Product
      `);
    });

    it("displays ancestors of a goal from other spaces", () => {
      const t = new TreeTester(["name", "space"], { spaceId: marketing.id });

      t.addGoal("G1", company, john);
      t.addGoal("G11", product, sarah, "G1");
      t.addGoal("G111", marketing, john, "G11");

      t.assertShape(`
        G1 Company
          G11 Product
            G111 Marketing
      `);
    });
  });

  describe("sorting", () => {
    it("closed goals are sorted last", () => {
      const t = new TreeTester(["name"], { showCompleted: true });

      t.addGoal("G1", company, john);
      t.addGoal("G2", company, john, null, { isClosed: true });
      t.addGoal("G3", company, john);

      t.assertShape(`
        G1
        G3
        G2
      `);
    });

    it("can sort nodes by name ascending", () => {
      const t = new TreeTester(["name"], { sortColumn: "name", sortDirection: "asc" });

      t.addGoal("A", company, john);
      t.addGoal("B", company, john);
      t.addGoal("C", company, john);

      t.addGoal("D", company, john, "A");
      t.addGoal("E", company, john, "A");
      t.addGoal("F", company, john, "A");

      t.assertShape(`
        A
          D
          E
          F
        B
        C
      `);
    });

    it("can sort nodes by name descending", () => {
      const t = new TreeTester(["name"], { sortColumn: "name", sortDirection: "desc" });

      t.addGoal("A", company, john);
      t.addGoal("B", company, john);
      t.addGoal("C", company, john);

      t.addGoal("D", company, john, "A");
      t.addGoal("E", company, john, "A");
      t.addGoal("F", company, john, "A");

      t.assertShape(`
        C
        B
        A
          F
          E
          D
      `);
    });
  });

  it("is able to select goals and projects for a person", () => {
    const t = new TreeTester(["name", "champion"], { personId: john.id });

    t.addGoal("G1", company, john);
    t.addGoal("G11", marketing, sarah, "G1");

    t.addGoal("G2", marketing, peter);
    t.addGoal("G21", product, sarah, "G2");
    t.addGoal("G211", product, john, "G21");
    t.addProj("P1", product, john, "G2");

    t.assertShape(`
      G1 John
        G11 Sarah
      G211 John
      P1 John
    `);
  });

  it("is able to select subgoals and projects for a goal", () => {
    const t = new TreeTester(["name"], { goalId: "G2" });

    t.addGoal("G1", company, john);
    t.addGoal("G2", marketing, sarah, "G1");
    t.addGoal("G3", marketing, john, "G2");
    t.addGoal("G4", marketing, john, "G3");
    t.addProj("P1", marketing, john, "G2");

    t.assertShape(`
      G3
        G4
      P1
    `);
  });
});
