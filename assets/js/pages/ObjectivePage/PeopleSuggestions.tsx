import { EditorMentionSearchFunc } from '../../components/Editor';
import { gql, ApolloClient } from '@apollo/client';

interface Person {
  fullName: string;
  title?: string;
  id: string;
}

const SEARCH_PEOPLE = gql`
  query SearchPeople($query: String!) {
    searchPeople(query: $query) {
      id
      fullName
      title
    }
  }
`;

export default function PeopleSuggestions(client : ApolloClient<any>) : EditorMentionSearchFunc {
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

