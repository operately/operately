import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';

import PageTitle from '../../components/PageTitle';
import AddMembersModal from './AddMembersModal';
import Avatar from '../../components/Avatar';

const GET_GROUP = gql`
  query GetGroup($id: ID!) {
    group(id: $id) {
      id
      name
      description

      members {
        id
        full_name
      }
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

interface Person {
  id: string;
  full_name: string;
}

function MemberList({ members } : { members: Person[] }) {
  return (
    <div className="flex gap-2">
      {members.map((m : Person) => (
        <Avatar key={m.id} person_full_name={m.full_name} />
      ))}
    </div>
  );
}

export function GroupPage() {
  const { id } = useParams();

  if (!id) return <p>Unable to find group</p>;

  const { loading, error, data, refetch } = useQuery(GET_GROUP, {
    variables: { id },
    fetchPolicy: 'cache-only'
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  const handleAddMembersModalSubmit = () => {
    refetch();
  }

  return (
    <div>
      <PageTitle title={data.group.name} />
      <MemberList members={data.group.members} />
      <AddMembersModal groupId={id} onSubmit={handleAddMembersModalSubmit} />
    </div>
  )
}
