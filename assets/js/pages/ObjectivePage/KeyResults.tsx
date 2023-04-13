import React from 'react';

import { useTranslation } from 'react-i18next';
import { useQuery, gql } from '@apollo/client';

const GET_KEY_RESULTS = gql`
  query GetKeyResults($objectiveID: ID!) {
    keyResults(objectiveID: $objectiveID) {
      id
      name
    }
  }
`;

interface KeyResult {
  id: string;
  name: string;
}

function KeyResult({keyResult} : {keyResult: KeyResult}) : JSX.Element {
  return (
    <div className="mt-4 flex gap-2 items-center">
      <div>
        <div className="font-bold">{keyResult.name}</div>
      </div>
    </div>
  );
}

export default function KeyResults({objectiveID} : {objectiveID: string}) {
  const { t } = useTranslation();
  const { loading, error, data } = useQuery(GET_KEY_RESULTS, {
    variables: { objectiveID: objectiveID },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return (
    <div>
      <h1>{t("KeyResults")}</h1>

      {data.keyResults.map((keyResult: KeyResult, index: number) => (
        <KeyResult key={index} keyResult={keyResult} />
      ))}
    </div>
  );
}
