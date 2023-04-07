import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';

import PageTitle from '../../components/PageTitle';

const GET_GROUP = gql`
  query GetGroup($id: ID!) {
    group(id: $id) {
      id
      name
      description
    }
  }
`;

export default function GroupPage() {
  const id = useParams().id;
  const { loading, error, data } = useQuery(GET_GROUP, {
    variables: { id },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return (
    <div>
      <PageTitle title={data.group.name} />
    </div>
  )
}
