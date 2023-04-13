import React from 'react';

import { useTranslation } from 'react-i18next';
import { useQuery, gql } from '@apollo/client';

import Table from './Table';

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

export default function KeyResults({objectiveID} : {objectiveID: string}) {
  const { t } = useTranslation();
  const { loading, error, data } = useQuery(GET_KEY_RESULTS, {
    variables: { objectiveID: objectiveID },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  const headers = [
    { id: "status", label: "Status" },
    { id: "completion", label: "Completion" },
    { id: "keyResult", label: "Key Result" },
    { id: "lastUpdated", label: "Last Updated" },
  ]

  const columnClasses = {
    status: "w-32",
    completion: "w-32",
    keyResult: "flex-1",
    lastUpdated: "w-32 text-right",
  };

  const rows = data.keyResults.map((keyResult: KeyResult) => {
    return {
      status: "Pending",
      completion: "---",
      keyResult: keyResult.name,
      lastUpdated: "---",
    }
  })

  return (
    <div>
      <Table headers={headers} columnClasses={columnClasses} rows={rows} />
    </div>
  );
}
