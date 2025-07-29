import Api from "@/api";
import { PageModule } from "@/routes/types";
import * as React from "react";

import * as People from "@/models/people";
import * as Projects from "@/models/projects";
import * as Time from "@/utils/time";

import { Feed, useItemsQuery } from "@/features/Feed";
import { PageCache } from "@/routes/PageCache";
import { DateField, ProjectPage, showErrorToast } from "turboui";
import { useMentionedPersonLookupFn } from "../../contexts/CurrentCompanyContext";
import { assertPresent } from "../../utils/assertions";
import { fetchAll } from "../../utils/async";

import { Paths, usePaths } from "@/routes/paths";

export default { name: "ProjectV2Page", loader, Page } as PageModule;

function pageCacheKey(id: string): string {
  return `v3-ProjectV2Page.project-${id}`;
}

type LoaderResult = {
  data: {
    project: Projects.Project;
    checkIns: any[];
    discussions: any[];
  };
  cacheVersion: number;
};

async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return await PageCache.fetch({
    cacheKey: pageCacheKey(params.id),
    refreshCache,
    fetchFn: () =>
      fetchAll({
        project: Projects.getProject({
          id: params.id,
          includeSpace: true,
          includeGoal: true,
          includeChampion: true,
          includeReviewer: true,
          includePermissions: true,
          includeContributors: true,
          includeKeyResources: true,
          includeMilestones: true,
          includeLastCheckIn: true,
          includePrivacy: true,
          includeRetrospective: true,
          includeUnreadNotifications: true,
        }).then((d) => d.project!),
        checkIns: Api.getProjectCheckIns({ projectId: params.id, includeAuthor: true }).then((d) => d.projectCheckIns!),
        discussions: Api.project_discussions.list({ projectId: params.id }).then((d) => d.discussions!),
      }),
  });
}

function Page() {
  const paths = usePaths();
  const { project, checkIns } = PageCache.useData(loader).data;

  const mentionedPersonLookup = useMentionedPersonLookupFn();

  assertPresent(project.space);
  assertPresent(project.permissions?.canEditName);

  const [projectName, setProjectName] = usePageField({
    value: (data) => data.project.name!,
    update: (v) => Api.editProjectName({ projectId: project.id!, name: v }).then(() => true),
    onError: (e: string) => showErrorToast(e, "Reverted the project name to its previous value."),
    validations: [(v) => (v.trim() === "" ? "Project name cannot be empty" : null)],
  });

  const [space, setSpace] = usePageField({
    value: (data) => prepareSpace(paths, data.project.space),
    update: (v) => Api.moveProjectToSpace({ projectId: project.id!, spaceId: v.id }).then(() => true),
    onError: () => showErrorToast("Network Error", "Reverted the space to its previous value."),
  });

  const [champion, setChampion] = usePageField({
    value: (data) => preparePerson(paths, data.project.champion),
    update: (_v) => Promise.resolve(true), // Simplified for now
    onError: () => showErrorToast("Network Error", "Reverted the champion to its previous value."),
  });

  const [reviewer, setReviewer] = usePageField({
    value: (data) => preparePerson(paths, data.project.reviewer),
    update: (_v) => Promise.resolve(true), // Simplified for now
    onError: () => showErrorToast("Network Error", "Reverted the reviewer to its previous value."),
  });

  const spaceSearch = useSpaceSearch();

  const props: ProjectPage.Props = {
    closeLink: paths.projectClosePath(project.id!),
    reopenLink: paths.resumeProjectPath(project.id!),

    projectName: projectName as string,
    updateProjectName: (name: string) => {
      setProjectName(name);
      return Promise.resolve(true);
    },

    description: project.description && JSON.parse(project.description),
    updateDescription: (description: any | null) => {
      return Api.updateProjectDescription({
        projectId: project.id!,
        description: JSON.stringify(description),
      })
        .then(() => {
          PageCache.invalidate(pageCacheKey(project.id!));
          return true;
        })
        .catch(() => false);
    },

    space: space as ProjectPage.Space,
    setSpace,
    spaceSearch,

    champion: champion as ProjectPage.Person | null,
    setChampion,

    reviewer: reviewer as ProjectPage.Person | null | undefined,
    setReviewer,

    startedAt: undefined, // Simplified for now
    setStartedAt: (_date: Date | null) => {
      // Simplified for now
    },
    dueAt: undefined, // Simplified for now
    setDueAt: (_date: DateField.ContextualDate | null) => {
      // Simplified for now
    },

    status: project.status as any,
    state: project.closedAt ? "closed" : project.status === "paused" ? "paused" : "active",
    closedAt: Time.parse(project.closedAt),

    canEdit: project.permissions?.canEditName || false,
    accessLevels: {
      company: "no_access" as const,
      space: "no_access" as const,
    },
    setAccessLevels: (_levels) => {
      // Simplified for now
    },

    // TaskBoard props - simplified for fast implementation
    tasks: [],
    milestones: [], // Simplified for now

    contributors: project.contributors?.map((c) => prepareContributor(paths, c)).filter(Boolean) || [],
    checkIns: prepareCheckIns(paths, checkIns),
    mentionedPersonLookup,

    activityFeed: <ProjectFeedItems projectId={project.id!} />,
  };

  return <ProjectPage key={project.id!} {...props} />;
}

function preparePerson(paths: Paths, person: People.Person | null | undefined) {
  if (!person) {
    return null;
  } else {
    return {
      id: person.id!,
      fullName: person.fullName!,
      title: person.title || "",
      avatarUrl: person.avatarUrl || "",
      profileLink: paths.profilePath(person.id!),
    };
  }
}

function prepareCheckIns(paths: Paths, checkIns: any[]): ProjectPage.CheckIn[] {
  return checkIns.map((checkIn) => {
    assertPresent(checkIn.author, "author must be present in check-in");

    return {
      id: checkIn.id!,
      author: preparePerson(paths, checkIn.author)!,
      date: Time.parse(checkIn.insertedAt!)!,
      link: paths.projectCheckInPath(checkIn.id!),
      content: JSON.parse(checkIn.description!),
      commentCount: checkIn.commentsCount!,
      status: checkIn.status!,
    };
  });
}

function prepareSpace(paths: Paths, space: any): ProjectPage.Space {
  return {
    id: space.id!,
    name: space.name!,
    link: paths.spacePath(space.id!),
  };
}

function ProjectFeedItems({ projectId }: { projectId: string }) {
  const { data, loading, error } = useItemsQuery("project", projectId);

  if (loading) return null;
  if (error) return null;
  if (!data) return null;

  return <Feed items={data!.activities!} page="project" testId="project-feed" />;
}

interface usePageFieldProps<T> {
  value: (LoaderResult) => T;
  update: (newValue: T) => Promise<{ success?: boolean | null } | boolean | null | undefined>;
  onError?: (error: any) => void;
  validations?: ((newValue: T) => string | null)[];
}

function usePageField<T>({ value, update, onError, validations }: usePageFieldProps<T>): [T, (v: T) => void] {
  const { data, cacheVersion } = PageCache.useData(loader, { refreshCache: false });

  const [state, setState] = React.useState<T>(() => value(data));
  const [stateVersion, setStateVersion] = React.useState<number | undefined>(cacheVersion);

  React.useEffect(() => {
    if (cacheVersion !== stateVersion) {
      setState(value(data));
      setStateVersion(cacheVersion);
    }
  }, [value, cacheVersion, stateVersion]);

  const updateState = (newVal: T): void => {
    if (validations) {
      for (const validation of validations) {
        const error = validation(newVal);
        if (error) {
          onError?.(error);
          return;
        }
      }
    }

    const oldVal = state;

    const successHandler = () => {
      PageCache.invalidate(pageCacheKey(data.project.id!));
    };

    const errorHandler = (error: any) => {
      setState(oldVal);
      onError?.(error);
    };

    setState(newVal);

    update(newVal)
      .then((res) => {
        if (res === false || (typeof res === "object" && res?.success === false)) {
          errorHandler("Update failed");
        } else {
          successHandler();
        }
      })
      .catch(errorHandler);
  };

  return [state, updateState];
}

function useSpaceSearch(): ProjectPage.Props["spaceSearch"] {
  const paths = usePaths();

  return async ({ query }: { query: string }): Promise<ProjectPage.Space[]> => {
    const data = await Api.spaces.search({ query: query });

    return data.spaces.map((space) => ({
      id: space.id!,
      name: space.name!,
      link: paths.spacePath(space.id!),
    }));
  };
}

function prepareContributor(paths: Paths, contributor: any): ProjectPage.Person | null {
  if (!contributor) {
    return null;
  }

  return {
    id: contributor.id!,
    fullName: contributor.fullName!,
    avatarUrl: contributor.avatarUrl || "",
    title: contributor.title || "",
    profileLink: paths.profilePath(contributor.id!),
  };
}
