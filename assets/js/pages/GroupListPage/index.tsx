import React from "react";
import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';

import ButtonLink from '../../components/ButtonLink';
import PageTitle from '../../components/PageTitle';
import Card from '../../components/Card';
import CardList from '../../components/CardList';

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

export async function GroupsListPageLoader(apolloClient : any) {
  await apolloClient.query({
    query: GET_GROUPS,
    fetchPolicy: 'network-only'
  });

  return {};
}

function ListOfGroups({groups}) {
  return (
      <CardList>
        {groups.map(({id, name}: any) => (
          <Link key={name} to={`/groups/${id}`}><Card>{name}</Card></Link>
        ))}
    </CardList>
  );
}

export function GroupListPage() {
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
  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <PageTitle
        title="Groups"
        buttons={[
          <ButtonLink key="new" to="/groups/new">Add Group</ButtonLink>
        ]}
      />

      <ListOfGroups groups={data.groups} />
    </>
  )
}
