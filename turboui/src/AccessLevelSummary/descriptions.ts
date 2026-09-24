import type { TFunction } from "i18next";
import type { AccessLevelSummaryProps } from "./index";

type AccessDescription = Pick<AccessLevelSummaryProps, "resourceType" | "tense"> & {
  access:
    | "public"
    | "company_view"
    | "company_comment"
    | "company_edit"
    | "company_full"
    | "space_view"
    | "space_comment"
    | "space_edit"
    | "invite_only";
};

export function describeAccess({ resourceType, tense, access }: AccessDescription, t: TFunction): string {
  const future = tense === "future";

  // Resource names are part of each message so translators can control articles and grammar.
  switch (access) {
    case "public":
      return {
        project: future
          ? t("Anyone on the internet will be able to view this project.")
          : t("Anyone on the internet can view this project."),
        goal: future
          ? t("Anyone on the internet will be able to view this goal.")
          : t("Anyone on the internet can view this goal."),
        space: future
          ? t("Anyone on the internet will be able to view this space.")
          : t("Anyone on the internet can view this space."),
      }[resourceType];
    case "company_view":
      return {
        project: future
          ? t("Everyone in the company will be able to view this project.")
          : t("Everyone in the company can view this project."),
        goal: future
          ? t("Everyone in the company will be able to view this goal.")
          : t("Everyone in the company can view this goal."),
        space: future
          ? t("Everyone in the company will be able to view this space.")
          : t("Everyone in the company can view this space."),
      }[resourceType];
    case "company_comment":
      return {
        project: future
          ? t("Everyone in the company will be able to view and comment on this project.")
          : t("Everyone in the company can view and comment on this project."),
        goal: future
          ? t("Everyone in the company will be able to view and comment on this goal.")
          : t("Everyone in the company can view and comment on this goal."),
        space: future
          ? t("Everyone in the company will be able to view and comment on this space.")
          : t("Everyone in the company can view and comment on this space."),
      }[resourceType];
    case "company_edit":
      return {
        project: future
          ? t("Everyone in the company will be able to view and edit this project.")
          : t("Everyone in the company can view and edit this project."),
        goal: future
          ? t("Everyone in the company will be able to view and edit this goal.")
          : t("Everyone in the company can view and edit this goal."),
        space: future
          ? t("Everyone in the company will be able to view and edit this space.")
          : t("Everyone in the company can view and edit this space."),
      }[resourceType];
    case "company_full":
      return {
        project: future
          ? t("Everyone in the company will have full access to this project.")
          : t("Everyone in the company has full access to this project."),
        goal: future
          ? t("Everyone in the company will have full access to this goal.")
          : t("Everyone in the company has full access to this goal."),
        space: future
          ? t("Everyone in the company will have full access to this space.")
          : t("Everyone in the company has full access to this space."),
      }[resourceType];
    case "space_view":
      if (resourceType === "space") return "";
      return {
        project: future
          ? t("Everyone in the space will be able to view this project.")
          : t("Everyone in the space can view this project."),
        goal: future
          ? t("Everyone in the space will be able to view this goal.")
          : t("Everyone in the space can view this goal."),
      }[resourceType];
    case "space_comment":
      if (resourceType === "space") return "";
      return {
        project: future
          ? t("Everyone in the space will be able to view and comment on this project.")
          : t("Everyone in the space can view and comment on this project."),
        goal: future
          ? t("Everyone in the space will be able to view and comment on this goal.")
          : t("Everyone in the space can view and comment on this goal."),
      }[resourceType];
    case "space_edit":
      if (resourceType === "space") return "";
      return {
        project: future
          ? t("Everyone in the space will be able to view and edit this project.")
          : t("Everyone in the space can view and edit this project."),
        goal: future
          ? t("Everyone in the space will be able to view and edit this goal.")
          : t("Everyone in the space can view and edit this goal."),
      }[resourceType];
    case "invite_only":
      return {
        project: future
          ? t("Only people you add to the project will be able to view it.")
          : t("Only people you add to the project can view it."),
        goal: future
          ? t("Only people you add to the goal will be able to view it.")
          : t("Only people you add to the goal can view it."),
        space: future
          ? t("Only people you add to the space will be able to view it.")
          : t("Only people you add to the space can view it."),
      }[resourceType];
  }
}
