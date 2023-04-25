import { gql, useQuery } from '@apollo/client';

const LIST_PROJECTS = gql`
  query ListProjects($groupId: ID) {
    projects(groupId: $groupId) {
      id
      name
      updatedAt

      owner {
        fullName
        title
      }
    }
  }
`;

interface ListProjectsVariables {
  groupId?: string;
  objectiveId?: string;
}

export function useProjects(variables : ListProjectsVariables) {
  return useQuery(LIST_PROJECTS, { variables });
}
