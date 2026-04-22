import { parseMilestonesForTurboUi, normalizeOrderingState } from "./index";

describe("parseMilestonesForTurboUi", () => {
  const paths = {
    projectMilestonePath: (id: string) => `/milestones/${id}`,
    projectMilestoneKanbanPath: (id: string) => `/milestones/${id}/kanban`,
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

describe("normalizeOrderingState", () => {
  describe("basic functionality", () => {
    it("normalizes ordering by appending missing milestone IDs", () => {
      const milestoneIds = ["m1", "m2", "m3"];
      const ordering = normalizeOrderingState(["m2"], milestoneIds);

      expect(ordering).toEqual(["m2", "m1", "m3"]);
    });

    it("removes unknown IDs from ordering state", () => {
      const milestoneIds = ["m1", "m2", "m3"];
      const ordering = normalizeOrderingState(["m2", "unknown", "m1"], milestoneIds);

      expect(ordering).toEqual(["m2", "m1", "m3"]);
    });

    it("removes duplicate IDs while preserving order", () => {
      const milestoneIds = ["m1", "m2", "m3"];
      const ordering = normalizeOrderingState(["m2", "m2", "m1", "m1"], milestoneIds);

      expect(ordering).toEqual(["m2", "m1", "m3"]);
    });

    it("handles empty ordering state", () => {
      const milestoneIds = ["m1", "m2", "m3"];
      const ordering = normalizeOrderingState([], milestoneIds);

      expect(ordering).toEqual(["m1", "m2", "m3"]);
    });

    it("handles empty milestone IDs", () => {
      const ordering = normalizeOrderingState(["m1", "m2"], []);

      expect(ordering).toEqual([]);
    });

    it("returns all milestone IDs when ordering is empty", () => {
      const milestoneIds = ["m1", "m2", "m3"];
      const ordering = normalizeOrderingState([], milestoneIds);

      expect(ordering).toEqual(["m1", "m2", "m3"]);
    });
  });

  describe("IDs with comments", () => {
    it("matches IDs with comments to UUIDs in ordering state", () => {
      const milestoneIds = [
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt",
        "pitch-rehearsed-with-FYGDNEB5LWCpIlp1K4CBdX",
      ];
      const orderingState = [
        "BLjKZ3IcqsH9PpGi55hRlt", // UUID only
        "F5cXEbrEVH0RsmpnpRg1nP", // UUID only
      ];

      const ordering = normalizeOrderingState(orderingState, milestoneIds);

      expect(ordering).toEqual([
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt",
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
        "pitch-rehearsed-with-FYGDNEB5LWCpIlp1K4CBdX",
      ]);
    });

    it("matches UUIDs to IDs with comments in ordering state", () => {
      const milestoneIds = [
        "F5cXEbrEVH0RsmpnpRg1nP",
        "BLjKZ3IcqsH9PpGi55hRlt",
        "FYGDNEB5LWCpIlp1K4CBdX",
      ];
      const orderingState = [
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt", // With comment
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP", // With comment
      ];

      const ordering = normalizeOrderingState(orderingState, milestoneIds);

      expect(ordering).toEqual([
        "BLjKZ3IcqsH9PpGi55hRlt",
        "F5cXEbrEVH0RsmpnpRg1nP",
        "FYGDNEB5LWCpIlp1K4CBdX",
      ]);
    });

    it("handles mixed ID formats in both arrays", () => {
      const milestoneIds = [
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
        "BLjKZ3IcqsH9PpGi55hRlt", // UUID only
        "pitch-rehearsed-with-FYGDNEB5LWCpIlp1K4CBdX",
      ];
      const orderingState = [
        "pitch-rehearsed-with-FYGDNEB5LWCpIlp1K4CBdX", // With comment
        "BLjKZ3IcqsH9PpGi55hRlt", // UUID only
      ];

      const ordering = normalizeOrderingState(orderingState, milestoneIds);

      expect(ordering).toEqual([
        "pitch-rehearsed-with-FYGDNEB5LWCpIlp1K4CBdX",
        "BLjKZ3IcqsH9PpGi55hRlt",
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
      ]);
    });

    it("preserves the actual milestone ID format in output", () => {
      const milestoneIds = [
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt",
      ];
      const orderingState = [
        "BLjKZ3IcqsH9PpGi55hRlt", // UUID only
      ];

      const ordering = normalizeOrderingState(orderingState, milestoneIds);

      // Should return the actual milestone ID with comment, not the UUID from ordering
      expect(ordering).toEqual([
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt",
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
      ]);
    });

    it("handles all real-world ID formats", () => {
      const milestoneIds = [
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt",
        "pitch-rehearsed-with-FYGDNEB5LWCpIlp1K4CBdX",
        "pitch-deck-narrative-and-C7MmCD8BKEUT384NrM9Hbj",
        "key-metrics-and-growth-FUdnf08tVJwrPsObddIyt2",
      ];
      const orderingState = [
        "C7MmCD8BKEUT384NrM9Hbj",
        "F5cXEbrEVH0RsmpnpRg1nP",
        "FUdnf08tVJwrPsObddIyt2",
      ];

      const ordering = normalizeOrderingState(orderingState, milestoneIds);

      expect(ordering).toEqual([
        "pitch-deck-narrative-and-C7MmCD8BKEUT384NrM9Hbj",
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
        "key-metrics-and-growth-FUdnf08tVJwrPsObddIyt2",
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt",
        "pitch-rehearsed-with-FYGDNEB5LWCpIlp1K4CBdX",
      ]);
    });
  });

  describe("deduplication with comments", () => {
    it("prevents duplicates when ordering has both UUID and commented version", () => {
      const milestoneIds = [
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt",
      ];
      const orderingState = [
        "F5cXEbrEVH0RsmpnpRg1nP",
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP", // Same milestone, different format
        "BLjKZ3IcqsH9PpGi55hRlt",
      ];

      const ordering = normalizeOrderingState(orderingState, milestoneIds);

      // Should only include each milestone once
      expect(ordering).toEqual([
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt",
      ]);
      expect(ordering.length).toBe(2);
    });

    it("uses the first occurrence when duplicates exist", () => {
      const milestoneIds = [
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt",
      ];
      const orderingState = [
        "BLjKZ3IcqsH9PpGi55hRlt", // First occurrence
        "F5cXEbrEVH0RsmpnpRg1nP",
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt", // Duplicate
      ];

      const ordering = normalizeOrderingState(orderingState, milestoneIds);

      // Should use the actual milestone ID and preserve first occurrence order
      expect(ordering).toEqual([
        "2-investor-meetings-BLjKZ3IcqsH9PpGi55hRlt",
        "1-mentions-F5cXEbrEVH0RsmpnpRg1nP",
      ]);
    });
  });

  describe("edge cases", () => {
    it("handles ordering state with only unknown IDs", () => {
      const milestoneIds = ["m1", "m2"];
      const ordering = normalizeOrderingState(["unknown1", "unknown2"], milestoneIds);

      expect(ordering).toEqual(["m1", "m2"]);
    });

    it("handles single milestone", () => {
      const milestoneIds = ["m1"];
      const ordering = normalizeOrderingState(["m1"], milestoneIds);

      expect(ordering).toEqual(["m1"]);
    });

    it("handles ordering state longer than milestone IDs", () => {
      const milestoneIds = ["m1", "m2"];
      const ordering = normalizeOrderingState(["m2", "m1", "m3", "m4", "m5"], milestoneIds);

      expect(ordering).toEqual(["m2", "m1"]);
    });
  });
});
