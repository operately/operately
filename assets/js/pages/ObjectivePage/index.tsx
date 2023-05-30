import React from "react";

import { useTranslation } from "react-i18next";
import { useQuery, gql } from "@apollo/client";
import { useParams } from "react-router-dom";

import * as PaperContainer from "../../components/PaperContainer";
import Icon from "@/components/Icon";
import Avatar, { AvatarSize } from "@/components/Avatar";

const GET_OBJECTIVE = gql`
  query GetObjective($id: ID!) {
    objective(id: $id) {
      id
      name
      description

      owner {
        fullName
        title
        avatarUrl
      }
    }
  }
`;

export async function ObjectivePageLoader(apolloClient: any, { params }) {
  const { id } = params;

  await apolloClient.query({
    query: GET_OBJECTIVE,
    variables: { id },
  });

  return {};
}

function Badge({ title, className }): JSX.Element {
  return (
    <div
      className="inline-block"
      style={{
        verticalAlign: "middle",
      }}
    >
      <div
        className={className + " font-bold uppercase flex items-center"}
        style={{
          padding: "4px 10px 2px",
          borderRadius: "25px",
          fontSize: "12.5px",
          lineHeight: "20px",
          height: "24px",
          letterSpacing: "0.03em",
          display: "flex",
          gap: "10",
          marginTop: "2px",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function Champion({ person }): JSX.Element {
  return (
    <div
      className="relative inline-block"
      style={{ marginRight: "10px", verticalAlign: "middle" }}
    >
      <Avatar person={person} size={AvatarSize.Small} />

      <div className="absolute top-[-6px] left-[21px]">
        <ChampionCrown />
      </div>
    </div>
  );
}

function ObjectiveHeader({ name, owner }): JSX.Element {
  return (
    <div className="flex items-center justify-between mt-[23px] ">
      <div className="flex gap-3.5 items-center">
        <Icon name="objectives" color="dark-2" size="large" />

        <h1 className="font-bold text-[31.1px]" style={{ lineHeight: "40px" }}>
          {name} <Champion person={owner} />{" "}
          <Badge title="On Track" className="bg-success-2 text-success-1" />
        </h1>
      </div>
    </div>
  );
}

function ChampionCrown() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="14" height="14" rx="3" fill="#3185FF" />
      <path
        d="M7 3.5L9.33333 7L12.25 4.66667L11.0833 10.5H2.91667L1.75 4.66667L4.66667 7L7 3.5Z"
        fill="#FFE600"
      />
    </svg>
  );
}

export function ObjectivePage() {
  const { t } = useTranslation();
  const { id } = useParams();

  if (!id) return <p>Unable to find objective</p>;

  const { loading, error, data } = useQuery(GET_OBJECTIVE, {
    variables: { id },
    fetchPolicy: "cache-only",
  });

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error)
    return (
      <p>
        {t("error.error")}: {error.message}
      </p>
    );

  return (
    <PaperContainer.Root>
      <PaperContainer.Navigation>
        <PaperContainer.NavigationItem
          icon="objectives"
          title={"Increase sales"}
          to={`/objectives/${id}`}
        />
      </PaperContainer.Navigation>

      <PaperContainer.Body>
        <ObjectiveHeader
          name={data.objective.name}
          owner={data.objective.owner}
        />
      </PaperContainer.Body>
    </PaperContainer.Root>
  );
}
