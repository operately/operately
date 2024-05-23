defmodule OperatelyWeb.GraphQL.Mutations.CompanyTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

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

    company = Operately.Companies.get_company_by_name("Acme Co.")
    account = Operately.People.get_account_by_email_and_password("john@your-company.com", "Aa12345#&!123")

    assert length(Operately.People.list_people(company.id)) == 1
    assert account != nil
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
