import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';

import PageTitle from '../../components/PageTitle';

const GET_TENETS = gql`
  query GetTenet($id: ID!) {
    tenet(id: $id) {
      id
      name
      description
    }
  }
`;

export async function TenetPageLoader(apolloClient : any, {params}) {
  const { id } = params;

  await apolloClient.query({
    query: GET_TENETS,
    variables: { id }
  });

  return {};
}

export function TenetPage() {
  const { id } = useParams();

  if (!id) return <p>Unable to find Tenet</p>;

  const { loading, error, data } = useQuery(GET_TENETS, {
    variables: { id },
    fetchPolicy: 'cache-only'
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return (
    <div>
      <PageTitle title={data.tenet.name} />
    </div>
  )
}
