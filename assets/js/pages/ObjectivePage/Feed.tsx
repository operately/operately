import React from 'react';

import { useQuery, gql, useApolloClient } from '@apollo/client';
import { useTranslation } from 'react-i18next';

import Avatar, {AvatarSize} from '../../components/Avatar';
import Editor from '../../components/Editor';
import RelativeTime from '../../components/RelativeTime';
import RichContent from '../../components/RichContent';

import PeopleSuggestions from './PeopleSuggestions';

interface Person {
  fullName: string;
  title: string;
  id: string;
}

interface Comment {
  id: string;
  content: string;
  author: Person;
}

interface Update {
  id: string;
  content: string;
  author: Person;
  insertedAt: string;
  comments: Comment[];
}

const UPDATE_ADDED_SUBSCRIPTION = gql`
  subscription OnUpdateAdded($updatableId: ID!, $updatableType: String!) {
    updateAdded(updatableId: $updatableId, updatableType: $updatableType) {
      id
    }
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
    }
  }
`;

const GET_UPDATES = gql`
  query updates($updatableId: ID!, $updatableType: String!) {
    updates(updatableId: $updatableId, updatableType: $updatableType) {
      id
      content
      insertedAt

      author {
        id
        fullName
      }

      comments {
        content
        author {
          id
          fullName
        }
      }
    }
  }
`;

function FeedItem({update} : {update: Update}) : JSX.Element {
  return (
    <div className="rounded-lg bg-white shadow-sm border border-stone-200 overflow-hidden">
      <div className="p-4 py-2 border-b border-stone-200">
        <div className="flex gap-1 items-center">
          <Avatar person_full_name={update.author.fullName} size={AvatarSize.Small} />
          <span className="ml-1">{update.author.fullName}</span>
          <span className="text-gray-400">posted an update <RelativeTime date={update.insertedAt} /></span>
        </div>
      </div>
      <RichContent jsonContent={update.content} />

      <Comments comments={update.comments} />
      <CommentEditor updateId={update.id} />
    </div>
  );
}

function Comment({comment}) : JSX.Element {
  return <div>
    <div className="flex gap-1 items-center ml-4 pt-4 border-t border-ston-200">
      <Avatar person_full_name={comment.author.fullName} size={AvatarSize.Small} />
      <span className="ml-1">{comment.author.fullName}</span>
    </div>

    <RichContent jsonContent={comment.content} />
  </div>;
}

function Comments({comments} : {comments: any[]}) : JSX.Element {
  return <>{comments.map((comment) => <Comment key={comment.id} comment={comment} />)}</>;
}

function CommentEditor({updateId}) : JSX.Element {
  const [active, setActive] = React.useState(false);

  const { t } = useTranslation();
  const client = useApolloClient();
  const peopleSearch = PeopleSuggestions(client);

  const handleAddComment = async ({json}) => {
    console.log("Saving")

    await client.mutate({
      mutation: CREATE_COMMENT,
      variables: {
        input: {
          updateId: updateId,
          content: JSON.stringify(json)
        }
      }
    })
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


export default function Feed({objectiveID} : {objectiveID: string}) : JSX.Element {
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

  if(data.updates.length == 0) {
    return <></>;
  }

  return <div className="mt-4" data-test="feed">
    <div className="text-sm uppercase">FEED</div>

    <div className="mt-4 flex flex-col gap-2">
      {data.updates.slice(0).reverse().map((update : Update) => <FeedItem key={update.id} update={update} />)}
    </div>
  </div>;
}
