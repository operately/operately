import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, gql, useApolloClient, ApolloClient } from '@apollo/client';
import { useParams } from 'react-router-dom';

import Avatar from '../../components/Avatar';
import PageTitle from '../../components/PageTitle';
import KeyResults from './KeyResults';
import Projects from './Projects';
import Editor, { EditorMentionSearchFunc } from '../../components/Editor';

const GET_OBJECTIVE = gql`
  query GetObjective($id: ID!) {
    objective(id: $id) {
      id
      name
      description

      owner {
        fullName
        title
      }
    }
  }
`;

const SEARCH_PEOPLE = gql`
  query SearchPeople($query: String!) {
    searchPeople(query: $query) {
      id
      fullName
      title
    }
  }
`;

interface Person {
  fullName: string;
  title: string;
  id: string;
}

function Champion({person} : {person: Person}) : JSX.Element {
  return (
    <div className="mt-4 flex gap-2 items-center">
      <Avatar person_full_name={person.fullName} />
      <div>
        <div className="font-bold">{person.fullName}</div>
        <div className="text-sm">{person.title}</div>
      </div>
    </div>
  );
}

export async function ObjectivePageLoader(apolloClient : any, {params}) {
  const { id } = params;

  await apolloClient.query({
    query: GET_OBJECTIVE,
    variables: { id }
  });

  return {};
}

function PeopleSuggestions(client : ApolloClient<any>) : EditorMentionSearchFunc {
  return ({query}) => {
    return new Promise((resolve) => {
      client
        .query({ query: SEARCH_PEOPLE, variables: { query } })
        .then(({ data }) => {
          resolve(
            data.searchPeople.map((person : Person) => ({
              id: person.id,
              label: person.fullName,
            })));
        })
        .catch((err : any) => {
          console.log(err);
        });
    });
  }
}

export function ObjectivePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const client = useApolloClient();
  const peopleSearch = PeopleSuggestions(client);

  if (!id) return <p>Unable to find objective</p>;

  const { loading, error, data } = useQuery(GET_OBJECTIVE, {
    variables: { id },
    fetchPolicy: 'cache-only'
  });

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error) return <p>{t("error.error")}: {error.message}</p>;

  return (
    <div>
      <PageTitle title={data.objective.name} />
      <p className="max-w-lg">{data.objective.description}</p>

      <Champion person={data.objective.owner as Person} />

      <KeyResults objectiveID={id} />
      <Projects objectiveID={id} />

      <Editor
        title={t("objectives.write_an_update.title")}
        placeholder={t("objectives.write_an_update.placeholder")}
        peopleSearch={peopleSearch}
        onSave={(data) => {
          console.log(data.json);
        }}
      />
    </div>
  )
}
