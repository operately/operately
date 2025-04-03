import { targetProgressPercentage, Target } from "./index";

describe("targetProgressPercentage", () => {
  it("handles targets where from is less than the target", () => {
    const target = { from: 0, to: 100, value: 60 } as unknown as Target;

    expect(targetProgressPercentage(target)).toBe(60);
  });

  it("handles targets where from is larget than the target", () => {
    const target = { from: 100, to: 0, value: 60 } as unknown as Target;

    expect(targetProgressPercentage(target)).toBe(40);
  });
});
