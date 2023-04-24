import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
        fullName
        avatarUrl
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
  fullName: string;
  avatarUrl?: string;
}

function MemberList({ members } : { members: Person[] }) {
  return (
    <div className="flex gap-2">
      {members.map((m : Person) => (
        <Avatar key={m.id} person={m} />
      ))}
    </div>
  );
}

export function GroupPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  if (!id) return <p>Unable to find group</p>;

  const { loading, error, data, refetch } = useQuery(GET_GROUP, {
    variables: { id },
    fetchPolicy: 'cache-only'
  });

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error) return <p>{t("error.error")}: {error.message}</p>;

  const handleAddMembersModalSubmit = () => {
    refetch();
  }

  return (
    <div>
      <PageTitle title={data.group.name} />
      <MemberList members={data.group.members} />
      <AddMembersModal groupId={id} members={data.group.members} onSubmit={handleAddMembersModalSubmit} />
    </div>
  )
}
