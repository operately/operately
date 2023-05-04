import React from "react";

import { useTranslation } from "react-i18next";
import { useQuery, gql } from "@apollo/client";

import Table from "./Table";
import StatusBadge from "./StatusBadge";
import Avatar from "../../components/Avatar";
import RelativeTime from "../../components/RelativeTime";

const GET_KEY_RESULTS = gql`
  query GetKeyResults($objectiveID: ID!) {
    keyResults(objectiveID: $objectiveID) {
      id
      name
      status
      updatedAt
      stepsCompleted
      stepsTotal

      owner {
        id
        fullName
        title
        avatarUrl
      }
    }
  }
`;

interface KeyResult {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  stepsCompleted: number;
  stepsTotal: number;
  owner: any;
}

export default function KeyResults({ objectiveID }: { objectiveID: string }) {
  const { t } = useTranslation();
  const { loading, error, data } = useQuery(GET_KEY_RESULTS, {
    variables: { objectiveID: objectiveID },
  });

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error)
    return (
      <p>
        {t("error.error")}: {error.message}
      </p>
    );

  const headers = [
    { id: "keyResult", label: t("keyResults.keyResult") },
    { id: "status", label: t("keyResults.status") },
    { id: "completion", label: t("keyResults.completion") },
    { id: "lastUpdated", label: t("keyResults.lastUpdated") },
    { id: "champion", label: t("keyResults.lastUpdated") },
  ];

  const columnClasses = {
    keyResult: "flex-1",
    status: "w-32",
    completion: "w-48",
    champion: "w-48 flex flex-row-reverse",
  };

  const rows = data.keyResults.map((keyResult: KeyResult) => {
    return {
      completion: (
        <div className="text-right">
          <div className="w-full h-2 bg-gray-700 rounded mb-1 overflow-hidden">
            <div
              className="h-2 bg-brand-base"
              style={{
                width: Math.floor(Math.random() * 100) + "%",
              }}
            >
              {" "}
            </div>
          </div>
          <div className="font-bold">
            <span>9</span> of 12 steps completed
          </div>
        </div>
      ),
      keyResult: (
        <div>
          <div className="font-bold">{keyResult.name}</div>
          <div className="text-sm">
            In Progress &middot; Last update{" "}
            <RelativeTime date={keyResult.updatedAt} />
          </div>
        </div>
      ),
      champion: (
        <div className="flex items-center gap-4">
          {keyResult.owner && (
            <div className="text-right">
              <div className="font-bold">{keyResult.owner.fullName}</div>
              <div className="text-xs">{keyResult.owner.title}</div>
            </div>
          )}
          <Avatar person={keyResult.owner} size="small" />
        </div>
      ),
    };
  });

  return (
    <div className="my-12">
      <Table headers={headers} columnClasses={columnClasses} rows={rows} />
    </div>
  );
}
