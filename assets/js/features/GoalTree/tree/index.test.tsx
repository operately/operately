import { Tree } from "./index";
import { Goal } from "@/models/goals";

describe("Tree", () => {
  it("is able to select goals for a single space", () => {
    const companySpace = { id: "1" };
    const marketingSpace = { id: "2" };
    const productSpace = { id: "3" };

    const allGoals = [
      goalForSpace(companySpace, "A", null),
      goalForSpace(marketingSpace, "B", "A"),
      goalForSpace(marketingSpace, "C", "A"),
      goalForSpace(marketingSpace, "D", "B"),
      goalForSpace(marketingSpace, "E", "D"),
      goalForSpace(productSpace, "F", "A"),
      goalForSpace(marketingSpace, "G", "F"),
      goalForSpace(marketingSpace, "H", null),
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

  it("is able to select goals for a person", () => {
    const personA = { id: "1" };
    const personB = { id: "2" };

    const allGoals = [
      goalForPerson(personB, "A", null),
      goalForPerson(personA, "B", "A"),
      goalForPerson(personA, "C", "A"),
      goalForPerson(personA, "D", "B"),
      goalForPerson(personA, "E", "D"),
      goalForPerson(personA, "F", "A"),
      goalForPerson(personA, "G", "F"),
      goalForPerson(personB, "H", null),
    ] as Goal[];

    const filters = {
      personId: personA.id,
    };

    const tree = new Tree(allGoals, "name", "asc", filters);

    expect(tree.getRoots().map((n) => n.name)).toEqual(["B", "C", "F"]);
    expect(getChildNames(tree, "B")).toEqual(["D"]);
    expect(getChildNames(tree, "C")).toEqual([]);
    expect(getChildNames(tree, "F")).toEqual(["G"]);
  });
});

function goalForSpace(space: { id: string }, name: string, parentGoalId: string | null): Goal {
  return {
    id: name,
    name,
    space,
    parentGoalId,
    title: name,
    projects: [],
  } as unknown as Goal;
}

function goalForPerson(person: { id: string }, name: string, parentGoalId: string | null): Goal {
  return {
    id: name,
    name,
    space: { id: "1" },
    champion: person,
    parentGoalId,
    title: name,
    projects: [],
  } as unknown as Goal;
}

const getChildNames = (tree: Tree, name: string) =>
  tree
    .getAllNodes()
    .find((n) => n.name === name)
    ?.children.map((n) => n.name);
