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
  const { loading, error, data, subscribeToMore, refetch } = useQuery(GET_GROUPS);

  React.useEffect(() => {
    subscribeToMore({
      document: GROUP_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        refetch();
        return prev;
      }
    })
  }, [])

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return data.groups.map(({ id, name, description }: any) => (
    <div key={id}>
      <p>
        {name}: {description}: {new Date().toLocaleTimeString()}
      </p>
    </div>
  ));
}
