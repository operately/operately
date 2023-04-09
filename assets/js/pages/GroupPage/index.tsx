import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';

import PageTitle from '../../components/PageTitle';
import AddMembersModal from './AddMembersModal';

const GET_GROUP = gql`
  query GetGroup($id: ID!) {
    group(id: $id) {
      id
      name
      description
    }
  }
`;

export async function GroupPageLoader(apolloClient : any, {params}) {
  const { id } = params;

  await apolloClient.query({
    query: GET_GROUP,
    variables: { id }
  });

  return {};
}

export function GroupPage() {
  const { id } = useParams();
  const { loading, error, data } = useQuery(GET_GROUP, {
    variables: { id },
    fetchPolicy: 'cache-only'
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return (
    <div>
      <PageTitle title={data.group.name} />
      <AddMembersModal groupId={id} />
    </div>
  )
}
