import { Tree } from "./index";
import { Goal } from "@/models/goals";

describe("Tree", () => {
  it("is able to select only goals for a space", () => {
    const companySpace = { id: "1" };
    const marketingSpace = { id: "2" };
    const productSpace = { id: "3" };

    const allGoals = [
      goalStub("A", companySpace),
      goalStub("B", marketingSpace, "A"),
      goalStub("C", marketingSpace, "A"),
      goalStub("D", marketingSpace, "B"),
      goalStub("E", marketingSpace, "D"),
      goalStub("F", productSpace, "A"),
      goalStub("G", marketingSpace, "F"),
      goalStub("H", marketingSpace),
    ] as Goal[];

    const filters = {
      spaceId: marketingSpace.id,
    };

    const tree = new Tree(allGoals, "name", "asc", filters);

    expect(tree.getRoots().map((n) => n.name)).toEqual(["B", "C", "G", "H"]);
    expect(getChildNames(tree, "B")).toEqual(["D"]);
    expect(getChildNames(tree, "C")).toEqual([]);
    expect(getChildNames(tree, "D")).toEqual(["E"]);
    expect(getChildNames(tree, "G")).toEqual([]);
    expect(getChildNames(tree, "H")).toEqual([]);
  });
});

const goalStub = (name: string, space: { id: string }, parentGoalId?: string) =>
  ({
    id: name,
    name,
    space,
    parentGoalId,
    title: name,
    projects: [],
  }) as unknown as Goal;

const getChildNames = (tree: Tree, name: string) =>
  tree
    .getAllNodes()
    .find((n) => n.name === name)
    ?.children.map((n) => n.name);
