import { moveItem, removeMilestone, serializeDefinition, readDefinition } from "./definition";

describe("template editing", () => {
  it("moves children without changing their identity", () => {
    expect(moveItem([{ key: "a" }, { key: "b" }], 1, -1)).toEqual([{ key: "b" }, { key: "a" }]);
  });
  it("moves removed milestone tasks to the project level", () => {
    const definition = {
      milestones: [{ key: "m", title: "Ship" }],
      tasks: [{ key: "t", name: "Build", milestone_key: "m" }],
    };
    expect(removeMilestone(definition, "m")).toEqual({
      milestones: [],
      tasks: [{ key: "t", name: "Build", milestone_key: null }],
    });
    expect(definition.tasks[0]?.milestone_key).toBe("m");
  });
  it("serializes numeric inputs and omits editor-only keys", () => {
    const json = serializeDefinition("goal", {
      name: "Goal",
      duration_days: "",
      targets: [{ editorKey: "local", name: "Target", unit: "%", from: "0", to: "50" }],
    });
    expect(JSON.parse(json)).toEqual({
      name: "Goal",
      description: null,
      duration_days: null,
      targets: [{ name: "Target", unit: "%", from: 0, to: 50 }],
    });
  });
  it("round-trips published definitions without losing task order", () => {
    const definition = {
      name: "Project",
      tasks: [
        { key: "b", name: "Second" },
        { key: "a", name: "First" },
      ],
    };
    expect(
      JSON.parse(serializeDefinition("project", readDefinition(JSON.stringify(definition)))).tasks.map(
        (t: { key: string }) => t.key,
      ),
    ).toEqual(["b", "a"]);
  });
});
