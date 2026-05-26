import { canDeleteFeedItems } from "./feedPermissions";

describe("HomePage feed permissions", () => {
  it("allows company admins to delete feed items", () => {
    expect(canDeleteFeedItems({ personId: "admin", adminIds: ["admin"], ownerIds: [] })).toBe(true);
  });

  it("allows company owners to delete feed items", () => {
    expect(canDeleteFeedItems({ personId: "owner", adminIds: [], ownerIds: ["owner"] })).toBe(true);
  });

  it("does not show feed delete actions to regular company members", () => {
    expect(canDeleteFeedItems({ personId: "member", adminIds: ["admin"], ownerIds: ["owner"] })).toBe(false);
  });
});
