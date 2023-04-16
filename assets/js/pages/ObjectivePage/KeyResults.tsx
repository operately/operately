import React from 'react';

import { useTranslation } from 'react-i18next';
import { useQuery, gql } from '@apollo/client';

import Table from './Table';
import StatusBadge from './StatusBadge';

const GET_KEY_RESULTS = gql`
  query GetKeyResults($objectiveID: ID!) {
    keyResults(objectiveID: $objectiveID) {
      id
      name
      status
      updatedAt
    }
  }
`;

interface KeyResult {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}

export default function KeyResults({objectiveID} : {objectiveID: string}) {
  const { t } = useTranslation();
  const { loading, error, data } = useQuery(GET_KEY_RESULTS, {
    variables: { objectiveID: objectiveID },
  });

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error) return <p>{t("error.error")}: {error.message}</p>;

  const headers = [
    { id: "status", label: t("keyResults.status") },
    { id: "completion", label: t("keyResults.completion") },
    { id: "keyResult", label: t("keyResults.keyResult") },
    { id: "lastUpdated", label: t("keyResults.lastUpdated") },
  ]

  const columnClasses = {
    status: "w-32",
    completion: "w-32",
    keyResult: "flex-1",
    lastUpdated: "w-32 text-right",
  };

  const rows = data.keyResults.map((keyResult: KeyResult) => {
    return {
      status: <StatusBadge status={keyResult.status} />,
      completion: "---",
      keyResult: keyResult.name,
      lastUpdated: t('intlDateTime', {
        val: Date.parse(keyResult.updatedAt),
        formatParams: {
          val: {month: 'long', day: 'numeric'},
        }
      }),
    }
  })

  return (
    <div>
      <Table headers={headers} columnClasses={columnClasses} rows={rows} />
    </div>
  );
}
