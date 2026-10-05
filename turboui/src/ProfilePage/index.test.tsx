import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ProfilePage } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";

setupTestCatalog();
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});
const person = {
  id: "person",
  fullName: "Ana <resource>",
  title: "Designer",
  email: "ana@example.com",
  avatarUrl: null,
  profileLink: "/people/person",
};
const props: ProfilePage.Props = {
  person,
  title: "Profile",
  manager: { ...person, id: "manager", fullName: "Manager name", profileLink: "/people/manager" },
  peers: Array.from({ length: 5 }, (_, i) => ({
    ...person,
    id: `peer-${i}`,
    fullName: `Peer ${i}`,
    profileLink: `/people/peer-${i}`,
  })),
  reports: [{ ...person, id: "report", fullName: "Report name", profileLink: "/people/report" }],
  workMap: [],
  reviewerWorkMap: [],
  activityFeed: <div data-testid="feed" />,
  editProfilePath: "/edit",
  canEditProfile: true,
  viewer: person,
  aboutMe: JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Literal biography" }] }],
  }),
  mentionedPersonLookup: async () => null,
  taskList: { canEdit: false },
  formattedTimePreferences: defaultFormattedTimePreferences,
};

test.each(["en", "pt-BR"])("profile tabs and colleague controls translate in %s", async (language) => {
  await i18n.changeLanguage(language);
  render(
    <MemoryRouter>
      <ProfilePage {...props} />
    </MemoryRouter>,
  );
  expect(screen.getByText(i18n.t("Assigned tasks will appear here."), { exact: false })).toBeVisible();
  expect(screen.getByRole("link", { name: i18n.t("Edit Profile") })).toHaveAttribute("href", "/edit");
  fireEvent.click(screen.getByText(i18n.t("About")));
  for (const key of ["About me", "Contact", "Colleagues", "Manager", "Peers"])
    expect(screen.getByText(i18n.t(key))).toBeVisible();
  expect(screen.getByText(i18n.t("Reports", { context: "people" }))).toBeVisible();
  expect(screen.getByText("Literal biography")).toBeVisible();
  expect(screen.getByText(person.email)).toBeVisible();
  expect(screen.queryByRole("link", { name: /Peer 4/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: i18n.t("Show all") }));
  expect(screen.getByRole("link", { name: /Peer 4/ })).toHaveAttribute("href", "/people/peer-4?tab=about");
  fireEvent.click(screen.getByText(i18n.t("Activity")));
  expect(screen.getByText(i18n.t("Recent activity"))).toBeVisible();
  expect(screen.getByTestId("feed")).toBeInTheDocument();
});

test("profile copy uses substituted translations", () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "Assigned tasks will appear here.": "Translated empty state",
      About: "Translated about",
      Contact: "Translated contact",
    },
    true,
    true,
  );
  render(
    <MemoryRouter>
      <ProfilePage {...props} />
    </MemoryRouter>,
  );
  expect(screen.getByText("Translated empty state", { exact: false })).toBeVisible();
  fireEvent.click(screen.getByText("Translated about"));
  expect(screen.getByText("Translated contact")).toBeVisible();
});
