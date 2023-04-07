import React from "react";
import { useSubscription, useQuery, gql } from '@apollo/client';

const GET_GROUPS = gql`
  query GetGroups {
    groups{
      id
      name
      description
    }
  }
`;

const GROUP_SUBSCRIPTION = gql`
  subscription OnGroupAdded {
    groupAdded {
      id
    }
  }
`;

export default function GroupListPage() {
  const { loading, error, data } = useQuery(GET_GROUPS);
  const { data: d1, loading: l1 } = useSubscription(GROUP_SUBSCRIPTION, {})

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return data.groups.map(({ id, name, description }: any) => (
    <div key={id}>
      <p>
        {name}: {description}
      </p>

      <h4>New group: {!l1 && console.log(d1)}</h4>
    </div>
  ));
}
