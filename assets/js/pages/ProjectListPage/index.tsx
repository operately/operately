import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';

import ButtonLink from '../../components/ButtonLink';
import PageTitle from '../../components/PageTitle';
import Card from '../../components/Card';
import CardList from '../../components/CardList';

const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      description
    }
  }
`;

const PROJECT_SUBSCRIPTION = gql`
  subscription OnProjectAdded {
    projectAdded {
      id
    }
  }
`;

export async function ProjectListPageLoader(apolloClient : any) {
  await apolloClient.query({
    query: GET_PROJECTS,
    fetchPolicy: 'network-only'
  });

  return {};
}

function ListOfProjects({projects}) {
  return (
      <CardList>
        {projects.map(({id, name, description}: any) => (
          <Link key={name} to={`/projects/${id}`}><Card>{name} - {description}</Card></Link>
        ))}
    </CardList>
  );
}

export function ProjectListPage() {
  const { t } = useTranslation();
  const { loading, error, data, subscribeToMore, refetch } = useQuery(GET_PROJECTS);

  React.useEffect(() => {
    subscribeToMore({
      document: PROJECT_SUBSCRIPTION,
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
        title={t("Projects")}
        buttons={[
          <ButtonLink key="new" to="/projects/new">{t("actions.add_project")}</ButtonLink>
        ]}
      />

      <ListOfProjects projects={data.projects} />
    </>
  )
}
