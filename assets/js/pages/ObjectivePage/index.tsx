import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, gql, useApolloClient, ApolloClient } from '@apollo/client';
import { useParams } from 'react-router-dom';

import Avatar from '../../components/Avatar';
import PageTitle from '../../components/PageTitle';
import KeyResults from './KeyResults';
import Projects from './Projects';
import Editor, { EditorMentionSearchFunc } from '../../components/Editor';

import Bold from '@tiptap/extension-bold'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Mention from '@tiptap/extension-mention'
import { generateHTML } from '@tiptap/html';

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

const CREATE_UPDATE = gql`
  mutation CreateUpdate($input: CreateUpdateInput!) {
    createUpdate(input: $input) {
      id
    }
  }
`;

const GET_UPDATES = gql`
  query updates($updatableId: ID!, $updatableType: String!) {
    updates(updatableId: $updatableId, updatableType: $updatableType) {
      id
      content
    }
  }
`;

interface Person {
  fullName: string;
  title: string;
  id: string;
}

interface Update {
  id: string;
  content: string;
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

function FeedItem({update} : {update: Update}) : JSX.Element {
  const json = JSON.parse(update.content);
  const html = generateHTML(json, [
    Document,
    Paragraph,
    Text,
    Bold,
    Mention,
  ]);

  return (
    <div className="prose" dangerouslySetInnerHTML={{__html: html}} />
  );
}

function Feed({objectiveID} : {objectiveID: string}) : JSX.Element {
  const { t } = useTranslation();
  const { loading, error, data } = useQuery(GET_UPDATES, {
    variables: {
      updatableId: objectiveID,
      updatableType: "objective"
    }
  });

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error) return <p>{t("error.error")}: {error.message}</p>;

  return (
    <div>
      {data.updates.map((update : Update) => <FeedItem key={update.id} update={update} />)}
    </div>
  );
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

  const handleAddUpdate = async ({json}) => {
    console.log("Saving update", JSON.stringify(json));

    await client.mutate({
      mutation: CREATE_UPDATE,
      variables: {
        input: {
          updatableId: id,
          updatableType: "objective",
          content: JSON.stringify(json),
        }
      }
    })
  }

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
        onSave={handleAddUpdate}
      />

      <Feed objectiveID={id} />
    </div>
  )
}
