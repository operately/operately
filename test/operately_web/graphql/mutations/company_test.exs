defmodule OperatelyWeb.GraphQL.Mutations.CompanyTest do
  use OperatelyWeb.ConnCase


  @add_first_company """
  mutation addFirstCompany($input: AddFirstCompanyInput!) {
    addFirstCompany(input: $input) {
      id
    }
  }
  """

  test "mutation: addFirstCompany", ctx do
    conn = graphql(ctx.conn, @add_first_company, %{
      :input => %{
        :companyName => "Acme Co.",
        :fullName => "John Doe",
        :email => "john@your-company.com",
        :role => "CEO",
        :password => "Aa12345#&!123",
        :passwordConfirmation => "Aa12345#&!123"
      }
    })

    res = json_response(conn, 200)
    assert Map.has_key?(res["data"]["addFirstCompany"], "id")

    id = res["data"]["addFirstCompany"]["id"]

    assert length(Operately.People.list_people(id)) == 1
    assert length(Operately.Companies.list_companies()) == 1
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
