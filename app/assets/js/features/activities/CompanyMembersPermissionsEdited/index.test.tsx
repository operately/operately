import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import i18n, { applyLanguage } from "@/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import type { Activity } from "@/api";
import type { Paths } from "@/routes/paths";
import Handler from ".";

const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };

function activityWithMembers(count: number): Activity {
  return {
    __typename: "activity",
    author: { __typename: "person", id: "author", fullName: "Alex Rivera", title: "Designer", type: "human" },
    content: {
      __typename: "activity_content_company_members_permissions_edited",
      members: Array.from({ length: count }, () => ({ updatedAccessLevelLabel: "Full access" })),
    },
  } as Activity;
}

function title(count: number) {
  return renderToStaticMarkup(
    <>{Handler.FeedItemTitle({ activity: activityWithMembers(count), page: "feed", paths: {} as Paths })}</>,
  ).trim();
}

const singular = "{{author}} has updated {{count}} member's access level";
const translated = {
  [`${singular}_one`]: "ONE {{count}} — {{author}}",
  [`${singular}_other`]: "MANY {{count}} — {{author}}",
  [`${singular}_zero`]: "ZERO {{count}} — {{author}}",
  "Updated your company access level to {{accessLevel}}": "ACCESS {{accessLevel}}",
};

afterEach(async () => {
  i18n.removeResourceBundle("pt-BR", "translation");
  i18n.addResourceBundle("pt-BR", "translation", portuguese);
  await applyLanguage("en");
});

it.each([0, 1, 3])("preserves English with a saved Portuguese preference and flag off (%i members)", async (count) => {
  i18n.addResourceBundle("pt-BR", "translation", translated, true, true);
  await applyLanguage("pt-BR");
  await applyLanguage(resolveEffectiveLanguage("pt-BR", false));
  expect(title(count)).toBe(
    `Alex has updated ${count} ${count === 1 ? "member&#x27;s" : "members&#x27;"} access level`,
  );
  expect(Handler.NotificationTitle({ activity: activityWithMembers(count) })).toBe(
    count === 0 ? "Updated your company access level" : "Updated your company access level to Full access",
  );
});

it.each([0, 1, 3])("falls back to English with missing Portuguese plurals (%i members)", async (count) => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await applyLanguage("pt-BR");
  expect(title(count)).toBe(
    `Alex has updated ${count} ${count === 1 ? "member&#x27;s" : "members&#x27;"} access level`,
  );
});

it("looks up complete counted sentences and notification titles at render time", async () => {
  i18n.addResourceBundle("pt-BR", "translation", translated, true, true);
  await applyLanguage("pt-BR");
  expect(title(0)).toBe("ZERO 0 — Alex");
  expect(title(1)).toBe("ONE 1 — Alex");
  expect(title(3)).toBe("MANY 3 — Alex");
  expect(Handler.NotificationTitle({ activity: activityWithMembers(1) })).toBe("ACCESS Full access");
});
