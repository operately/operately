import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';

import Avatar from '../../components/Avatar';
import PageTitle from '../../components/PageTitle';

const GET_OBJECTIVE = gql`
  query GetObjective($id: ID!) {
    objective(id: $id) {
      id
      name
      description

      owner {
        full_name
        title
      }
    }
  }
`;

interface Person {
  full_name: string;
  title: string;
}

function Champion({person} : {person: Person}) : JSX.Element {
  return (
    <div className="mt-4 flex gap-2 items-center">
      <Avatar person_full_name={person.full_name} />
      <div>
        <div className="font-bold">{person.full_name}</div>
        <div className="text-sm">{person.title}</div>
      </div>
    </div>
  );
}

export async function ObjectivePageLoader(apolloClient : any, {params}) {
  const { id } = params;

  await apolloClient.query({
    query: GET_OBJECTIVE,
    variables: { id }
  });

  return {};
}

export function ObjectivePage() {
  const { id } = useParams();

  if (!id) return <p>Unable to find objective</p>;

  const { loading, error, data } = useQuery(GET_OBJECTIVE, {
    variables: { id },
    fetchPolicy: 'cache-only'
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return (
    <div>
      <PageTitle title={data.objective.name} />
      <p className="max-w-lg">{data.objective.description}</p>

      <Champion person={data.objective.owner as Person} />
    </div>
  )
}
