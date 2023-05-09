import React from "react";
import { useQuery, gql } from "@apollo/client";
import { useParams, Link } from "react-router-dom";
import Avatar from "../../components/Avatar";

import PageTitle from "../../components/PageTitle";

const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      description

      owner {
        id
        fullName
        title
        avatarUrl
      }
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

            <div className="mt-4 flex gap-2 items-center">
              <div>
                <div className="font-bold">{data.project.owner.fullName}</div>
                <div className="text-sm">{data.project.owner.title}</div>
              </div>
              <Avatar person={data.project.owner} />
            </div>

            <div className="flex gap-8">
              <div className="text-new-dark-3 text-xl max-w-3xl bg-new-dark-2 rounded p-8 px-8 w-2/3">
                <p>
                  Software development teams are constantly striving to improve
                  their processes to deliver high-quality software faster and
                  more efficiently. The DevOps Research and Assessment (DORA)
                  metrics are widely recognized as a standard for measuring
                  software development performance. However, collecting and
                  analyzing DORA metrics can be a challenging and time-consuming
                  task. To address this need, we propose "Superpace," a software
                  tool designed to help teams and organizations improve their
                  software development processes using the DORA metrics.
                </p>

                <p className="mt-4">
                  The primary objective of "Superpace" is to provide a
                  comprehensive view of an organization's software development
                  processes, enabling teams to identify areas for improvement
                  and optimize their workflows. The tool focuses on the four key
                  areas of DORA metrics, which are deployment frequency, lead
                  time for changes, mean time to restore (MTTR), and change
                  failure rate. By collecting and analyzing data from various
                  sources, including code repositories, continuous
                  integration/continuous delivery (CI/CD) systems, and issue
                  tracking systems, "Superpace" will provide teams with valuable
                  insights to make informed decisions.
                </p>
              </div>

              <div className="text-new-dark-3 text-xl max-w-3xl bg-new-dark-2 rounded p-8 px-16 w-1/3">
                <div>Igor Sarcevic</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
