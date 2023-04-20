import React from "react";
import { useTranslation } from 'react-i18next';

import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';

import ButtonLink from '../../components/ButtonLink';
import PageTitle from '../../components/PageTitle';
import Card from '../../components/Card';
import CardList from '../../components/CardList';
import Avatar, {AvatarSize} from '../../components/Avatar';

const GET_OBJECTIVES = gql`
  query GetObjectives {
    objectives {
      id
      name
      description

      owner {
        id
        fullName
        avatarUrl
        title
      }
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
      {objectives.map((objective: any) => (
        <Link key={objective.name} to={`/objectives/${objective.id}`}>
          <Card>
            <div className="flex items-center gap-2 justify-between">
              <div className="max-w-2xl">
                <div className="text-brand-base font-bold">{objective.name}</div>
                <div className="text-dark-1 truncate">{objective.description}</div>
              </div>

              <div className="flex items-center gap-2">
                <Avatar person={objective.owner} size={AvatarSize.Normal} />

                <div>
                  <div className="font-medium">{objective.owner.fullName}</div>
                  <div className="text-xs">{objective.owner.title}</div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
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
