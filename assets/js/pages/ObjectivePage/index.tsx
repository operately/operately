import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, gql, useApolloClient, ApolloClient } from '@apollo/client';
import { useParams } from 'react-router-dom';

import Avatar, {AvatarSize} from '../../components/Avatar';
import PageTitle from '../../components/PageTitle';
import KeyResults from './KeyResults';
import Projects from './Projects';
import Editor, { EditorMentionSearchFunc } from '../../components/Editor';
import RelativeTime from '../../components/RelativeTime';

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
      author {
        id
        fullName
      }
      insertedAt
    }
  }
`;

const UPDATE_ADDED_SUBSCRIPTION = gql`
  subscription OnUpdateAdded($updatableId: ID!, $updatableType: String!) {
    updateAdded(updatableId: $updatableId, updatableType: $updatableType) {
      id
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
  author: Person;
  insertedAt: string;
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
    <div className="rounded-lg bg-white shadow-sm border border-stone-200 overflow-hidden">
      <div className="p-4 py-2 border-b border-stone-200">
        <div className="flex gap-1 items-center">
          <Avatar person_full_name={update.author.fullName} size={AvatarSize.Small} />
          <span className="ml-1">{update.author.fullName}</span>
          <span className="text-gray-400">posted an update <RelativeTime date={update.insertedAt} /></span>
        </div>
      </div>
      <div className="prose p-4" dangerouslySetInnerHTML={{__html: html}} />

      <CommentEditor />
    </div>
  );
}

function CommentEditor() : JSX.Element {
  const [active, setActive] = React.useState(false);

  const { t } = useTranslation();
  const client = useApolloClient();
  const peopleSearch = PeopleSuggestions(client);

  const handleAddComment = async ({json}) => {
    console.log(json)
    // await client.mutate({
    //   mutation: CREATE_UPDATE,
    //   variables: {
    //     input: {
    //       updatableId: id,
    //       updatableType: "objective",
    //       content: JSON.stringify(json),
    //     }
    //   }
    // })
  }


  if (!active) {
    return (
      <div className="p-4 text-gray-500 cursor-pointer bg-light-1 flex items-center gap-2" onClick={() => setActive(true)}>
        <Avatar person_full_name="IS" size={AvatarSize.Small} />
        <span>{t("objectives.leave_comment.placeholder")}</span>
      </div>
    );
  } else {
    return <Editor
      placeholder={t("objectives.leave_comment.placeholder")}
      peopleSearch={peopleSearch}
      onSave={handleAddComment}
    />;
  }
}


function Feed({objectiveID} : {objectiveID: string}) : JSX.Element {
  const { t } = useTranslation();
  const { loading, error, data, refetch, subscribeToMore } = useQuery(GET_UPDATES, {
    variables: {
      updatableId: objectiveID,
      updatableType: "objective"
    }
  });

  React.useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: UPDATE_ADDED_SUBSCRIPTION,
      variables: {
        updatableId: objectiveID,
        updatableType: "objective"
      },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        refetch();
        return prev;
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error) return <p>{t("error.error")}: {error.message}</p>;

  return <div className="mt-4" data-test="feed">
    <div className="text-sm uppercase">FEED</div>

    <div className="mt-4 flex flex-col gap-2">
      {data.updates.slice(0).reverse().map((update : Update) => <FeedItem key={update.id} update={update} />)}
    </div>
  </div>;
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

      <div className="mt-4 rounded bg-white shadow-sm border border-stone-200">
        <Editor
          title={t("objectives.write_an_update.title")}
          placeholder={t("objectives.write_an_update.placeholder")}
          peopleSearch={peopleSearch}
          onSave={handleAddUpdate}
        />
      </div>

      <Feed objectiveID={id} />
    </div>
  )
}
