import { gql } from "@apollo/client";
import * as Pages from "@/components/Pages";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";

import * as fragments from "@/graphql/Fragments";
import * as KeyResources from "@/graphql/Projects/key_resources";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Permissions from "@/graphql/Projects/permissions";
import * as Updates from "@/graphql/Projects/updates";
import * as People from "@/graphql/People";

interface LoaderResult {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: GET_PROJECT,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
  };
}

export function useLoadedData() {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}

const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
      insertedAt
      startedAt
      deadline
      nextUpdateScheduledAt
      health

      isArchived
      archivedAt

      private

      space {
        id
        name
        icon
        color
      }

      lastCheckIn ${Updates.UPDATE_FRAGMENT}
      permissions ${Permissions.FRAGMENT}

      keyResources ${KeyResources.GQL_FRAGMENT}
      milestones ${Milestones.FRAGMENT}

      contributors ${fragments.CONTRIBUTOR}
      champion ${People.FRAGMENT}
      reviewer ${People.FRAGMENT}

      nextMilestone ${Milestones.FRAGMENT}
    }
  }
`;
