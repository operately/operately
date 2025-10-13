import { parseMilestonesForTurboUi } from "./index";

describe("parseMilestonesForTurboUi", () => {
  const paths = {
    projectMilestonePath: (id: string) => `/milestones/${id}`,
  } as any;

  it("orders milestones according to ordering state", () => {
    const result = parseMilestonesForTurboUi(
      paths,
      [
        { id: "m1", title: "First", status: "pending" },
        { id: "m2", title: "Second", status: "pending" },
        { id: "m3", title: "Third", status: "pending" },
      ] as any,
      ["m3", "m1"],
    );

    expect(result.orderingState).toEqual(["m3", "m1", "m2"]);
    expect(result.orderedMilestones.map((m) => m.id)).toEqual(["m3", "m1", "m2"]);
  });

  it("filters out unknown ids and removes duplicates", () => {
    const result = parseMilestonesForTurboUi(
      paths,
      [
        { id: "m1", title: "First", status: "pending" },
        { id: "m2", title: "Second", status: "pending" },
      ] as any,
      ["m2", "unknown", "m2", "m1"],
    );

    expect(result.orderingState).toEqual(["m2", "m1"]);
    expect(Object.keys(result.milestonesById)).toEqual(["m1", "m2"]);
  });

  it("falls back to natural order when no ordering is provided", () => {
    const result = parseMilestonesForTurboUi(
      paths,
      [
        { id: "m1", title: "First", status: "pending" },
        { id: "m2", title: "Second", status: "done" },
      ] as any,
    );

    expect(result.orderingState).toEqual(["m1", "m2"]);
    expect(result.orderedMilestones.map((m) => m.id)).toEqual(["m1", "m2"]);
  });
});
