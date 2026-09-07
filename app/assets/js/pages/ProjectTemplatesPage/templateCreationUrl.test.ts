import { updateTemplateCreationSearchParams } from "./templateCreationUrl";

describe("template creation URL state", () => {
  it("sets the creation parameter without removing other parameters", () => {
    const result = updateTemplateCreationSearchParams(new URLSearchParams("archive=active"), true);

    expect(result.toString()).toBe("archive=active&new=true");
  });

  it("removes only the creation parameter when the modal closes", () => {
    const result = updateTemplateCreationSearchParams(new URLSearchParams("archive=active&new=true"), false);

    expect(result.toString()).toBe("archive=active");
  });
});
