import React from "react";

import { useTranslation } from "react-i18next";
import { useQuery, gql } from "@apollo/client";
import { useParams } from "react-router-dom";

import PageTitle from "../../components/PageTitle";

import KeyResults from "./KeyResults";
import Projects from "./Projects";
import PostAnUpdate from "./PostAnUpdate";
import Feed from "./Feed";
import Champion from "./Champion";
import { Link } from "react-router-dom";

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
    <div className="max-w-6xl mx-auto mb-4">
      <div className="m-11 mt-24">
        <div className="flex items-center mb-4 gap-2">
          <Link to="/company" className="font-bold underline">
            Acme Inc.
          </Link>

          <div className="font-bold">/</div>

          <Link to="/objectives" className="font-bold underline">
            Exceptional customer service
          </Link>
        </div>

        <div className="flex items-start justify-between my-4">
          <div>
            <h1 className="font-bold text-3xl my-4">{data.objective.name}</h1>

            <div className="text-new-dark-3 text-xl max-w-xl">
              Recent surveys show that the general public is not aware of the
              services we offer, especially outside of Europe.
            </div>
          </div>

          <div className="text-right">
            {data.objective.owner && <Champion person={data.objective.owner} />}
          </div>
        </div>

        <KeyResults objectiveID={id} />
        <Projects objectiveID={id} />
      </div>

      <div className="max-w-5xl mx-auto mb-4">
        <div className="m-11 p-11 mt-20 bg-new-dark-2">
          <div className="flex items-center justify-around relative -mt-14 mb-12">
            <h1 className="uppercase font-bold bg-slate-700 px-3 py-1 rounded z-50">
              Status updates and activity
            </h1>
          </div>

          <PostAnUpdate objectiveID={id} />
          <Feed objectiveID={id} />
        </div>
      </div>
    </div>
  );
}
