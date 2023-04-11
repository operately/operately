import React from "react";
import { useTranslation } from "react-i18next";

import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';

import ButtonLink from '../../components/ButtonLink';
import PageTitle from '../../components/PageTitle';
import Card from '../../components/Card';
import CardList from '../../components/CardList';

const GET_TENETS = gql`
  query GetTenets {
    tenets {
      id
      name
      description
    }
  }
`;

const TENET_SUBSCRIPTION = gql`
  subscription OnTenetAdded {
    tenetAdded {
      id
    }
  }
`;

export async function TenetListPageLoader(apolloClient : any) {
  await apolloClient.query({
    query: GET_TENETS,
    fetchPolicy: 'network-only'
  });

  return {};
}

function ListOfTenets({ tenets }: any) {
  return (
      <CardList>
        {tenets.map(({id, name, description}: any) => (
          <Link key={name} to={`/tenets/${id}`}><Card>{name} - {description}</Card></Link>
        ))}
    </CardList>
  );
}

export function TenetListPage() {
  const { t } = useTranslation();

  const { loading, error, data, subscribeToMore, refetch } = useQuery(GET_TENETS);

  React.useEffect(() => {
    subscribeToMore({
      document: TENET_SUBSCRIPTION,
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
        title={t("Tenets")}
        buttons={[
          <ButtonLink key="new" to="/tenets/new">{t("actions.add_tenet")}</ButtonLink>
        ]}
      />

      <ListOfTenets tenets={data.tenets} />
    </>
  )
}
