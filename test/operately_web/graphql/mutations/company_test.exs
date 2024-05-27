defmodule OperatelyWeb.GraphQL.Mutations.CompanyTest do
  use OperatelyWeb.ConnCase

  @add_first_company """
  mutation AddFirstCompany($input: AddFirstCompanyInput!) {
    addFirstCompany(input: $input) {
      id
    }
  }
  """

  @add_first_company_input %{
    :input => %{
      :companyName => "Acme Co.",
      :fullName => "John Doe",
      :email => "john@your-company.com",
      :role => "CEO",
      :password => "Aa12345#&!123",
      :passwordConfirmation => "Aa12345#&!123"
    }
  }

  describe "mutation: AddFirstCompany" do
    test "creates company and admin account", ctx do
      conn = graphql(ctx.conn, @add_first_company, "AddFirstCompany", @add_first_company_input)
      res = json_response(conn, 200)

      assert Map.has_key?(res["data"]["addFirstCompany"], "id")

      company = Operately.Companies.get_company_by_name("Acme Co.")
      account = Operately.People.get_account_by_email_and_password("john@your-company.com", "Aa12345#&!123")
      group = Operately.Groups.get_group(company.company_space_id)

      assert Operately.Repo.aggregate(Operately.People.Person, :count, :id) == 1
      assert account != nil
      assert group != nil
    end

    test "allows company and admin account creation only once", ctx do
      conn = graphql(ctx.conn, @add_first_company, "AddFirstCompany", @add_first_company_input)
      res = json_response(conn, 200)

      assert res["data"] != nil

      conn = graphql(ctx.conn, @add_first_company, "AddFirstCompany", @add_first_company_input)
      res = json_response(conn, 200)

      assert res["data"] == nil
      assert Operately.Companies.count_companies() == 1
    end
  end

  defp graphql(conn, query, operation_name, variables) do
    payload = %{
      operationName: operation_name,
      query: query,
      variables: variables,
    }

    conn |> post("/api/gql", payload)
  end
end
