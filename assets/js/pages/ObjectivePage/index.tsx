import React from 'react';

import { useTranslation } from 'react-i18next';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';

import PageTitle from '../../components/PageTitle';

import KeyResults from './KeyResults';
import Projects from './Projects';
import PostAnUpdate from './PostAnUpdate';
import Feed from './Feed';
import Champion from './Champion';

const GET_OBJECTIVE = gql`
  query GetObjective($id: ID!) {
    objective(id: $id) {
      id
      name
      description

      owner {
        fullName
        title
      }
    }
  }
`;

export async function ObjectivePageLoader(apolloClient : any, {params}) {
  const { id } = params;

  await apolloClient.query({
    query: GET_OBJECTIVE,
    variables: { id }
  });

  return {};
}

export function ObjectivePage() {
  const { t } = useTranslation();
  const { id } = useParams();

  if (!id) return <p>Unable to find objective</p>;

  const { loading, error, data } = useQuery(GET_OBJECTIVE, {
    variables: { id },
    fetchPolicy: 'cache-only'
  });

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error) return <p>{t("error.error")}: {error.message}</p>;

  return (
    <div>
      <div className="flex items-end justify-between text-dark-1 mb-10">
        <div>
          <PageTitle title={data.objective.name} />
          <p className="max-w-lg">{data.objective.description}</p>
        </div>

        {data.objective.owner && <Champion person={data.objective.owner} />}
      </div>

      <KeyResults objectiveID={id} />
      <Projects objectiveID={id} />

      <PostAnUpdate objectiveID={id} />

      <Feed objectiveID={id} />
    </div>
  )
}
