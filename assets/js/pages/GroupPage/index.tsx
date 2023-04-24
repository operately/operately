import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import AddMembersModal from './AddMembersModal';
import Avatar from '../../components/Avatar';
import GroupMission from './GroupMission';
import PointsOfContact from './PointsOfContact';

const GET_GROUP = gql`
  query GetGroup($id: ID!) {
    group(id: $id) {
      id
      name
      mission

      members {
        id
        fullName
        avatarUrl
      }

      pointsOfContact {
        id
        name
        type
        value
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
    <div className="flex gap-2 mb-4">
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
      <h1 className="text-2xl">{data.group.name}</h1>

      <div className="mb-4">
        <GroupMission
          groupId={id}
          mission={data.group.mission}
          onMissionChanged={refetch} />
      </div>

      <MemberList members={data.group.members} />
      <AddMembersModal groupId={id} members={data.group.members} onSubmit={handleAddMembersModalSubmit} />

      <PointsOfContact
        groupId={id}
        groupName={data.group.name}
        pointsOfContact={data.group.pointsOfContact}
      />
    </div>
  )
}
