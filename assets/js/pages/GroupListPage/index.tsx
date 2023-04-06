import React from "react";
import { useQuery, gql } from '@apollo/client';

const GET_GROUPS = gql`
  query GetGroups {
    groups{
      id
      name
      description
    }
  }
`;

export default function GroupListPage() {
  const { loading, error, data } = useQuery(GET_GROUPS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return data.groups.map(({ id, name, description }: any) => (
    <div key={id}>
      <p>
        {name}: {description}
      </p>
    </div>
  ));
}
