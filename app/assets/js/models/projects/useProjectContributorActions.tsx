import * as React from "react";

import { type Project, type ProjectContributor } from "@/api";
import { accessLevelAsEnumValue } from "@/features/Permissions";
import * as People from "@/models/people";
import {
  useCreateProjectContributor,
  useUpdateProjectContributor,
  useDeleteProjectContributor,
} from "./projectLifecycle";
import { Paths, usePaths } from "@/routes/paths";
import { ProjectPage, showErrorToast } from "turboui";

type Contributor = ProjectPage.Contributor;
type ContributorFormValues = {
  person: { id: string; fullName: string; avatarUrl: string | null; title?: string; profileLink?: string };
  responsibility: string | null;
  accessLevel: number;
};

interface UseProjectContributorActionsOptions {
  project: Project;
}

export function useProjectContributorActions({ project }: UseProjectContributorActionsOptions) {
  const paths = usePaths();
  const { mutateAsync: createContributor } = useCreateProjectContributor();
  const { mutateAsync: updateContributor } = useUpdateProjectContributor();
  const { mutateAsync: deleteContributor } = useDeleteProjectContributor();

  const canEdit = Boolean(project.permissions?.canEdit);

  const initialContributors = React.useMemo(
    () => prepareContributors(paths, project.contributors || []),
    [paths, project.contributors],
  );

  const [contributors, setContributors] = React.useState<Contributor[]>(initialContributors);

  React.useEffect(() => {
    setContributors(initialContributors);
  }, [initialContributors]);

  const contributorPersonIds = React.useMemo(
    () => contributors.flatMap((contributor) => (contributor.person?.id ? [contributor.person.id] : [])),
    [contributors],
  );

  const transformPerson = React.useCallback(
    (person: People.Person) => People.parsePersonForTurboUi(paths, person)!,
    [paths],
  );

  const contributorPersonSearch = People.usePersonFieldSearch({
    scope: { type: "project", id: project.id },
    ignoredIds: contributorPersonIds,
    transformResult: transformPerson,
  });

  const onContributorCreate = React.useCallback(
    async (values: ContributorFormValues) => {
      const tempId = `temp-contributor-${Date.now()}`;
      const optimistic: Contributor = {
        id: tempId,
        person: {
          id: values.person.id,
          fullName: values.person.fullName,
          avatarUrl: values.person.avatarUrl,
          title: values.responsibility ?? "",
          profileLink: values.person.profileLink ?? paths.profilePath(values.person.id),
        },
        responsibility: values.responsibility,
        accessLevel: values.accessLevel,
      };

      setContributors((prev) => [...prev, optimistic]);

      try {
        const result = await createContributor({
          projectId: project.id,
          personId: values.person.id,
          responsibility: values.responsibility ?? "",
          permissions: accessLevelAsEnumValue(values.accessLevel),
          role: "contributor",
        });

        const realId = result.projectContributor?.id;
        if (!realId) {
          setContributors((prev) => prev.filter((contributor) => contributor.id !== tempId));
          showErrorToast("Contributor not added", "Something went wrong. Please try again.");
          return false;
        }

        setContributors((prev) =>
          prev.map((contributor) => (contributor.id === tempId ? { ...optimistic, id: realId } : contributor)),
        );
        return true;
      } catch (error) {
        console.error("Failed to add contributor", error);
        setContributors((prev) => prev.filter((contributor) => contributor.id !== tempId));
        showErrorToast("Contributor not added", "Something went wrong. Please try again.");
        return false;
      }
    },
    [createContributor, paths, project.id],
  );

  const onContributorUpdate = React.useCallback(
    async (contributorId: string, updates: Partial<ContributorFormValues>) => {
      let snapshot: Contributor[] = [];

      setContributors((prev) => {
        snapshot = prev;
        return prev.map((contributor) => {
          if (contributor.id !== contributorId) return contributor;

          const responsibility =
            updates.responsibility !== undefined ? updates.responsibility : contributor.responsibility;
          const person = updates.person
            ? {
                ...updates.person,
                title: responsibility ?? "",
                profileLink: updates.person.profileLink ?? paths.profilePath(updates.person.id),
              }
            : contributor.person
              ? { ...contributor.person, title: responsibility ?? "" }
              : null;

          return {
            ...contributor,
            person,
            responsibility: responsibility ?? null,
            accessLevel: updates.accessLevel !== undefined ? updates.accessLevel : contributor.accessLevel,
          };
        });
      });

      try {
        await updateContributor({
          contribId: contributorId,
          personId: updates.person?.id,
          responsibility: updates.responsibility ?? undefined,
          permissions: updates.accessLevel !== undefined ? accessLevelAsEnumValue(updates.accessLevel) : undefined,
        });
        return true;
      } catch (error) {
        console.error("Failed to update contributor", error);
        setContributors(snapshot);
        showErrorToast("Contributor not updated", "Something went wrong. Please try again.");
        return false;
      }
    },
    [paths, updateContributor],
  );

  const onContributorDelete = React.useCallback(
    async (contributorId: string) => {
      let snapshot: Contributor[] = [];

      setContributors((prev) => {
        snapshot = prev;
        return prev.filter((contributor) => contributor.id !== contributorId);
      });

      try {
        await deleteContributor({ contribId: contributorId });
      } catch (error) {
        console.error("Failed to remove contributor", error);
        setContributors(snapshot);
        showErrorToast("Contributor not removed", "Something went wrong. Please try again.");
      }
    },
    [deleteContributor],
  );

  const includeDemotedContributor = React.useCallback(
    (personId: string) => {
      const source = (project.contributors || []).find((contributor) => contributor.person?.id === personId);
      const prepared = prepareContributor(paths, source);
      if (!prepared?.person?.id) return;

      setContributors((prev) => {
        if (prev.some((contributor) => contributor.person?.id === personId)) return prev;
        return [...prev, prepared];
      });
    },
    [paths, project.contributors],
  );

  const excludePromotedContributor = React.useCallback((personId: string): Contributor | null => {
    let removed: Contributor | null = null;

    setContributors((prev) => {
      const next: Contributor[] = [];

      for (const contributor of prev) {
        if (contributor.person?.id === personId) {
          removed = contributor;
        } else {
          next.push(contributor);
        }
      }

      return next;
    });

    return removed;
  }, []);

  const restoreContributor = React.useCallback((contributor: Contributor) => {
    setContributors((prev) => {
      if (prev.some((existing) => existing.id === contributor.id || existing.person?.id === contributor.person?.id)) {
        return prev;
      }
      return [...prev, contributor];
    });
  }, []);

  return {
    contributors,
    canEditContributors: canEdit,
    contributorPersonSearch,
    includeDemotedContributor,
    excludePromotedContributor,
    restoreContributor,
    onContributorCreate: canEdit ? onContributorCreate : undefined,
    onContributorUpdate: canEdit ? onContributorUpdate : undefined,
    onContributorDelete: canEdit ? onContributorDelete : undefined,
  };
}

function prepareContributors(paths: Paths, contributors: ProjectContributor[]): Contributor[] {
  return contributors
    .filter((contributor) => contributor.role === "contributor")
    .map((contributor) => prepareContributor(paths, contributor))
    .filter(Boolean) as Contributor[];
}

function prepareContributor(paths: Paths, contributor: ProjectContributor | null | undefined): Contributor | null {
  if (!contributor?.id || !contributor.person) {
    return null;
  }

  return {
    id: contributor.id,
    person: {
      id: contributor.person.id,
      fullName: contributor.person.fullName,
      avatarUrl: contributor.person.avatarUrl || "",
      title: contributor.responsibility || "",
      profileLink: paths.profilePath(contributor.person.id),
    },
    responsibility: contributor.responsibility ?? null,
    accessLevel: contributor.accessLevel ?? 70,
  };
}
