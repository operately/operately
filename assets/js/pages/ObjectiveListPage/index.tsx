import React from "react";
import { useTranslation } from 'react-i18next';

import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';

import ButtonLink from '../../components/ButtonLink';
import PageTitle from '../../components/PageTitle';
import Card from '../../components/Card';
import CardList from '../../components/CardList';

const GET_OBJECTIVES = gql`
  query GetObjectives {
    objectives {
      id
      name
      description
    }
  }
`;

const OBJECTIVE_SUBSCRIPTION = gql`
  subscription OnObjectiveAdded {
    objectiveAdded {
      id
    }
  }
`;

export async function ObjectiveListPageLoader(apolloClient : any) {
  await apolloClient.query({
    query: GET_OBJECTIVES,
    fetchPolicy: 'network-only'
  });

  return {};
}

function ListOfObjectives({objectives}) {
  return (
      <CardList>
        {objectives.map(({id, name, description}: any) => (
          <Link key={name} to={`/objectives/${id}`}><Card>{name} - {description}</Card></Link>
        ))}
    </CardList>
  );
}

export function ObjectiveListPage() {
  const { t } = useTranslation();
  const { loading, error, data, subscribeToMore, refetch } = useQuery(GET_OBJECTIVES);

  React.useEffect(() => {
    subscribeToMore({
      document: OBJECTIVE_SUBSCRIPTION,
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
        title={t('Objectives')}
        buttons={[
          <ButtonLink key="new" to="/objectives/new">{t("actions.add_objective")}</ButtonLink>
        ]}
      />

      <ListOfObjectives objectives={data.objectives} />
    </>
  )
}
