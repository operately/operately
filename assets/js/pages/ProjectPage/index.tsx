import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';

import PageTitle from '../../components/PageTitle';

const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
    }
  }
`;

export async function ProjectPageLoader(apolloClient : any, {params}) {
  const { id } = params;

  await apolloClient.query({
    query: GET_PROJECT,
    variables: { id }
  });

  return {};
}

export function ProjectPage() {
  const { id } = useParams();

  if (!id) return <p>Unable to find project</p>;

  const { loading, error, data } = useQuery(GET_PROJECT, {
    variables: { id },
    fetchPolicy: 'cache-only'
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return (
    <div>
      <PageTitle title={data.project.name} />
    </div>
  )
}
