import { viewerCanPostCheckIn } from "./checkInPermissions";

const champion = {
  id: "champion",
  fullName: "Frank Miller",
  avatarUrl: null,
  title: "VP of Product",
  profileLink: "/people/frank",
};

const reviewer = {
  id: "reviewer",
  fullName: "David Brown",
  avatarUrl: null,
  title: "CTO",
  profileLink: "/people/david",
};

describe("viewerCanPostCheckIn", () => {
  it("is true when the current viewer is the active project's champion with edit access", () => {
    expect(
      viewerCanPostCheckIn({
        champion,
        currentUser: champion,
        permissions: { canEdit: true },
        state: "active",
      }),
    ).toBe(true);
  });

  it("is false when another editor is viewing the project", () => {
    expect(
      viewerCanPostCheckIn({
        champion,
        currentUser: reviewer,
        permissions: { canEdit: true },
        state: "active",
      }),
    ).toBe(false);
  });

  it("is false when the project is closed", () => {
    expect(
      viewerCanPostCheckIn({
        champion,
        currentUser: champion,
        permissions: { canEdit: true },
        state: "closed",
      }),
    ).toBe(false);
  });
});
