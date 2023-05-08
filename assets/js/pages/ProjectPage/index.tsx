import React from "react";
import { useQuery, gql } from "@apollo/client";
import { useParams, Link } from "react-router-dom";

import PageTitle from "../../components/PageTitle";

const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description
    }
  }
`;

export async function ProjectPageLoader(apolloClient: any, { params }) {
  const { id } = params;

  await apolloClient.query({
    query: GET_PROJECT,
    variables: { id },
  });

  return {};
}

export function ProjectPage() {
  const { id } = useParams();

  if (!id) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data } = useQuery(GET_PROJECT, {
    variables: { id },
    fetchPolicy: "cache-only",
  });

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;

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
            <h1 className="font-bold text-3xl my-4">{data.project.name}</h1>

            <div className="text-new-dark-3 text-xl max-w-xl">
              Recent surveys show that the general public is not aware of the
              services we offer, especially outside of Europe.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
