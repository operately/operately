import type { TFunction } from "i18next";
import type { AccessLevelSummaryProps } from "./index";

type AccessDescription = Pick<AccessLevelSummaryProps, "resourceType" | "tense"> & {
  access:
    | "public"
    | "public_company_comment"
    | "public_company_edit"
    | "public_company_full"
    | "company_view"
    | "company_comment"
    | "company_edit"
    | "company_full"
    | "company_view_space_comment"
    | "company_view_space_edit"
    | "company_view_space_full"
    | "company_comment_space_edit"
    | "company_comment_space_full"
    | "company_edit_space_full"
    | "space_view"
    | "space_comment"
    | "space_edit"
    | "invite_only";
};

export function describeAccess({ resourceType, tense, access }: AccessDescription, t: TFunction): string {
  const future = tense === "future";

  // Each description is one message, including additional permissions, so translators can reorder it.
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
    case "public_company_comment":
      return {
        project: future
          ? t(
              "Anyone on the internet will be able to view this project. Company members will be able to view and comment.",
            )
          : t("Anyone on the internet can view this project. Company members can view and comment."),
        goal: future
          ? t(
              "Anyone on the internet will be able to view this goal. Company members will be able to view and comment.",
            )
          : t("Anyone on the internet can view this goal. Company members can view and comment."),
        space: future
          ? t(
              "Anyone on the internet will be able to view this space. Company members will be able to view and comment.",
            )
          : t("Anyone on the internet can view this space. Company members can view and comment."),
      }[resourceType];
    case "public_company_edit":
      return {
        project: future
          ? t("Anyone on the internet will be able to view this project. Company members will have edit access.")
          : t("Anyone on the internet can view this project. Company members have edit access."),
        goal: future
          ? t("Anyone on the internet will be able to view this goal. Company members will have edit access.")
          : t("Anyone on the internet can view this goal. Company members have edit access."),
        space: future
          ? t("Anyone on the internet will be able to view this space. Company members will have edit access.")
          : t("Anyone on the internet can view this space. Company members have edit access."),
      }[resourceType];
    case "public_company_full":
      return {
        project: future
          ? t("Anyone on the internet will be able to view this project. Company members will have full access.")
          : t("Anyone on the internet can view this project. Company members have full access."),
        goal: future
          ? t("Anyone on the internet will be able to view this goal. Company members will have full access.")
          : t("Anyone on the internet can view this goal. Company members have full access."),
        space: future
          ? t("Anyone on the internet will be able to view this space. Company members will have full access.")
          : t("Anyone on the internet can view this space. Company members have full access."),
      }[resourceType];
    case "company_view_space_comment":
      if (resourceType === "space") return "";
      return {
        project: future
          ? t(
              "Everyone in the company will be able to view this project. Space members will be able to view and comment.",
            )
          : t("Everyone in the company can view this project. Space members can view and comment."),
        goal: future
          ? t("Everyone in the company will be able to view this goal. Space members will be able to view and comment.")
          : t("Everyone in the company can view this goal. Space members can view and comment."),
      }[resourceType];
    case "company_view_space_edit":
      if (resourceType === "space") return "";
      return {
        project: future
          ? t("Everyone in the company will be able to view this project. Space members will have edit access.")
          : t("Everyone in the company can view this project. Space members have edit access."),
        goal: future
          ? t("Everyone in the company will be able to view this goal. Space members will have edit access.")
          : t("Everyone in the company can view this goal. Space members have edit access."),
      }[resourceType];
    case "company_view_space_full":
      if (resourceType === "space") return "";
      return {
        project: future
          ? t("Everyone in the company will be able to view this project. Space members will have full access.")
          : t("Everyone in the company can view this project. Space members have full access."),
        goal: future
          ? t("Everyone in the company will be able to view this goal. Space members will have full access.")
          : t("Everyone in the company can view this goal. Space members have full access."),
      }[resourceType];
    case "company_comment_space_edit":
      if (resourceType === "space") return "";
      return {
        project: future
          ? t(
              "Everyone in the company will be able to view and comment on this project. Space members will have edit access.",
            )
          : t("Everyone in the company can view and comment on this project. Space members have edit access."),
        goal: future
          ? t(
              "Everyone in the company will be able to view and comment on this goal. Space members will have edit access.",
            )
          : t("Everyone in the company can view and comment on this goal. Space members have edit access."),
      }[resourceType];
    case "company_comment_space_full":
      if (resourceType === "space") return "";
      return {
        project: future
          ? t(
              "Everyone in the company will be able to view and comment on this project. Space members will have full access.",
            )
          : t("Everyone in the company can view and comment on this project. Space members have full access."),
        goal: future
          ? t(
              "Everyone in the company will be able to view and comment on this goal. Space members will have full access.",
            )
          : t("Everyone in the company can view and comment on this goal. Space members have full access."),
      }[resourceType];
    case "company_edit_space_full":
      if (resourceType === "space") return "";
      return {
        project: future
          ? t(
              "Everyone in the company will be able to view and edit this project. Space members will have full access.",
            )
          : t("Everyone in the company can view and edit this project. Space members have full access."),
        goal: future
          ? t("Everyone in the company will be able to view and edit this goal. Space members will have full access.")
          : t("Everyone in the company can view and edit this goal. Space members have full access."),
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
