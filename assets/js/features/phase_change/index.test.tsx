import * as PhaseChange from "./index";

describe("PhaseChange.handler", () => {
  it("returns a retrospective handler for non-terminal -> terminal change", () => {
    expect(PhaseChange.handler("planning", "completed")).toBeInstanceOf(PhaseChange.Retrospective);
    expect(PhaseChange.handler("execution", "completed")).toBeInstanceOf(PhaseChange.Retrospective);
    expect(PhaseChange.handler("control", "completed")).toBeInstanceOf(PhaseChange.Retrospective);

    expect(PhaseChange.handler("planning", "canceled")).toBeInstanceOf(PhaseChange.Retrospective);
    expect(PhaseChange.handler("execution", "canceled")).toBeInstanceOf(PhaseChange.Retrospective);
    expect(PhaseChange.handler("control", "canceled")).toBeInstanceOf(PhaseChange.Retrospective);
  });

  it("returns a restart handler for terminal -> non-terminal change", () => {
    expect(PhaseChange.handler("completed", "planning")).toBeInstanceOf(PhaseChange.Restart);
    expect(PhaseChange.handler("canceled", "planning")).toBeInstanceOf(PhaseChange.Restart);

    expect(PhaseChange.handler("completed", "execution")).toBeInstanceOf(PhaseChange.Restart);
    expect(PhaseChange.handler("canceled", "execution")).toBeInstanceOf(PhaseChange.Restart);

    expect(PhaseChange.handler("completed", "control")).toBeInstanceOf(PhaseChange.Restart);
    expect(PhaseChange.handler("canceled", "control")).toBeInstanceOf(PhaseChange.Restart);
  });
});
