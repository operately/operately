import * as Projects from "@/models/projects";
import { loader } from "./loader";

jest.mock("@/models/projects", () => ({
  getProject: jest.fn(),
}));

describe("ProjectCheckInNewPage loader", () => {
  it("loads the last check-in for reference while writing a new one", async () => {
    (Projects.getProject as jest.Mock).mockResolvedValue({ project: { id: "project-1" } });

    await loader({ params: { projectID: "project-1" } });

    expect(Projects.getProject).toHaveBeenCalledWith(
      expect.objectContaining({
        includeLastCheckIn: true,
      }),
    );
  });
});
