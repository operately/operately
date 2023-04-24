import React from "react";
import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import ButtonLink from '../../components/ButtonLink';
import PageTitle from '../../components/PageTitle';
import Card from '../../components/Card';
import CardList from '../../components/CardList';

const GET_GROUPS = gql`
  query GetGroups {
    groups{
      id
      name
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
  const { t } = useTranslation();
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

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error) return <p>{t("error.error")}: {error.message}</p>;

  return (
    <>
      <PageTitle
        title={t("Groups")}
        buttons={[
          <ButtonLink key="new" to="/groups/new">{t("actions.add_group")}</ButtonLink>
        ]}
      />

      <ListOfGroups groups={data.groups} />
    </>
  )
}
