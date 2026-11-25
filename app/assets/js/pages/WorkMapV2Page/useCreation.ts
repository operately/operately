import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { Company, Space, WorkMapItem } from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useActiveProjectTemplates } from "@/models/projectTemplates";
import { parseSpaceForTurboUI, useEditableSpaces, useGetSpacePrivacy, useSpaceSearch } from "@/models/spaces";
import { invalidateWorkMapSettingsQueries, useWorkMapItems } from "@/models/workMap";
import { compareIds, usePaths } from "@/routes/paths";
import { shouldShowFirstProjectOnboarding } from "../CompanyWorkMapPage/firstProjectOnboarding";
import { dismissToast, showErrorToast, type WorkMapV2PageProps } from "turboui";

export function useCreation(workMap: WorkMapItem[], company: Company, space?: Space): WorkMapV2PageProps["creation"] {
  const me = useMe();
  const paths = usePaths();
  const navigate = useNavigate();
  const client = useQueryClient();
  const options = useCreationOptions(space);
  const spaceSearch = useSpaceSearch({ accessLevel: "edit_access" });
  const defaultSpace = space ?? options?.spaces.find((s) => compareIds(s.id, company.companySpaceId));
  const onboarding =
    !space &&
    shouldShowFirstProjectOnboarding({
      isOwner: company.owners?.some((owner) => compareIds(owner.id, me?.id)) ?? false,
      setupCompleted: company.setupCompleted,
      hasWorkItems: workMap.length > 0,
      canAddItem: Boolean(defaultSpace),
    });

  const [, addItem] = useWorkMapItems(workMap, { projectChampionId: onboarding ? me?.id : undefined });
  const getSpacePrivacy = useGetSpacePrivacy();

  if (!options) return undefined;

  return {
    defaultSpace: defaultSpace ? parseSpaceForTurboUI(paths, defaultSpace) : undefined,
    spaces: options.spaces.map((s) => parseSpaceForTurboUI(paths, s)),
    spaceSearch,
    getSpacePrivacy,
    save: async (attrs) => {
      const item = await addItem(attrs);
      void invalidateWorkMapSettingsQueries(client);
      return item;
    },
    templates: options.templates,
    onCreateProjectTemplate: (id) => navigate(paths.newProjectTemplatePath(id)),
    templateLibraryPath: space ? paths.spaceProjectTemplatesPath(space.id) : paths.projectTemplatesPath(),
    onFirstItemCreated: onboarding
      ? (type, id) => navigate(type === "project" ? paths.projectPath(id) : paths.goalPath(id))
      : undefined,
  };
}

function useCreationOptions(space?: Space) {
  const { t } = useTranslation();
  const canEdit = !space || Boolean(space.permissions?.canEdit);
  const editableSpaces = useEditableSpaces({ enabled: canEdit });
  const spaces = editableSpaces.data;
  const canCreate = canEdit && Boolean(space || spaces?.length);
  const templates = useActiveProjectTemplates({ enabled: canCreate });

  const failedQuery = [editableSpaces, templates].find((query) => query.isEnabled && query.isLoadingError);
  const retry = failedQuery?.refetch;

  React.useEffect(() => {
    if (!retry) return;
    const id = showErrorToast(t("Couldn't load options for adding goals and projects."), t("Try loading them again."), {
      action: { label: t("Try again"), onClick: () => void retry() },
    });
    return () => dismissToast(id);
  }, [retry, t]);

  if (!canCreate || !spaces || !templates.data) return undefined;
  return {
    spaces,
    templates: templates.data
      .filter((template) => spaces.some((s) => compareIds(s.id, template.space.id)))
      .map((template) => ({ ...template, spaceId: template.space.id })),
  };
}
