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

interface Header {
  id: string;
  label: string;
}

interface Row {
  [key: string]: string;
}

function Table({headers, columnClasses, rows}) : JSX.Element {
  return (
    <div className="mt-4 flex flex-col gap-2 items-center rounded border border-stone-200">
      <div className="w-full flex gap-2 justify-between px-4 py-1 border-b border-stone-200">
        {headers.map((header: Header, index: number) => (
          <div key={index} className={columnClasses[header.id]}>{header.label}</div>
        ))}
      </div>

      {rows.map((row: Row, index: number) => {
        return <div className="w-full flex gap-2 justify-between px-4 py-1 border-b border-stone-200">
          {headers.map((header: Header) => (
            <div key={index} className={columnClasses[header.id]}>{row[header.id]}</div>
          ))}
        </div>;
      })}
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
