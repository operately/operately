import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';

import PageTitle from '../../components/PageTitle';

const GET_KPI = gql`
  query GetKpi($id: ID!) {
    kpi(id: $id) {
      id
      name
      description
    }
  }
`;

export async function KpiPageLoader(apolloClient : any, {params}) {
  const { id } = params;

  await apolloClient.query({
    query: GET_KPI,
    variables: { id }
  });

  return {};
}

export function KpiPage() {
  const { id } = useParams();

  if (!id) return <p>Unable to find kpi</p>;

  const { loading, error, data } = useQuery(GET_KPI, {
    variables: { id },
    fetchPolicy: 'cache-only'
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return (
    <div>
      <PageTitle title={data.kpi.name} />
    </div>
  )
}
