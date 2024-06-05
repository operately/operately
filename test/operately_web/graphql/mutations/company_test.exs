defmodule OperatelyWeb.GraphQL.Mutations.CompanyTest do
  use OperatelyWeb.ConnCase

  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures


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

      account = Operately.Repo.preload(account, :person)

      assert account.person.company_role == :admin
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


  @add_company_member """
  mutation AddCompanyMember($input: AddCompanyMemberInput!) {
    addCompanyMember(input: $input) {
      id
      token
    }
  }
  """

  @add_company_member_input %{
    :input => %{
      :fullName => "John Doe",
      :email => "john@your-company.com",
      :title => "Developer",
    }
  }

  describe "mutation: AddCompanyMember" do
    setup :register_and_log_in_account

    test "member account can't invite other members", ctx do
      conn = graphql(ctx.conn, @add_company_member, "AddCompanyMember", @add_company_member_input)
      res = json_response(conn, 200)

      assert res["data"] == nil
      assert res["errors"] |> List.first() |> Map.get("message") == "Only admins can add members"
    end

    test "creates first-time-access token for new member", ctx do
      account = account_fixture()
      person_fixture(%{
        account_id: account.id,
        company_id: ctx.company.id,
        company_role: :admin,
      })
      conn = log_in_account(ctx.conn, account)

      conn = graphql(conn, @add_company_member, "AddCompanyMember", @add_company_member_input)
      res = json_response(conn, 200)

      assert Map.has_key?(res["data"]["addCompanyMember"], "token")
    end
  end

  describe "mutation: AddCompanyMember errors" do
    setup ctx do
      company = company_fixture()
      account = account_fixture()
      person_fixture(%{
        account_id: account.id,
        company_id: company.id,
        company_role: :admin,
      })

      %{ conn: log_in_account(ctx.conn, account) }
    end

    test "email already taken", ctx do
      conn = graphql(ctx.conn, @add_company_member, "AddCompanyMember", @add_company_member_input)
      json_response(conn, 200)

      conn = graphql(ctx.conn, @add_company_member, "AddCompanyMember", @add_company_member_input)
      res = json_response(conn, 200)

      assert res["errors"] |> List.first() |> Map.get("field") == "email"
      assert res["errors"] |> List.first() |> Map.get("message") == "has already been taken"
    end

    test "email can't be blank", ctx do
      input = %{
        :input => %{
          :fullName => "John Doe",
          :email => "",
          :title => "Developer",
        }
      }

      conn = graphql(ctx.conn, @add_company_member, "AddCompanyMember", input)
      res = json_response(conn, 200)

      assert res["errors"] |> List.first() |> Map.get("field") == "email"
      assert res["errors"] |> List.first() |> Map.get("message") == "can't be blank"
    end

    test "full_name can't be blank", ctx do
      input = %{
        :input => %{
          :fullName => "",
          :email => "john@your-company.com",
          :title => "Developer",
        }
      }

      conn = graphql(ctx.conn, @add_company_member, "AddCompanyMember", input)
      res = json_response(conn, 200)

      assert res["errors"] |> List.first() |> Map.get("field") == "full_name"
      assert res["errors"] |> List.first() |> Map.get("message") == "can't be blank"
    end
  end


  @remove_company_member """
  mutation RemoveCompanyMember($personId: ID!) {
    removeCompanyMember(personId: $personId) {
      id
    }
  }
  """

  describe "mutation: RemoveCompanyMember" do
    setup do
    company = company_fixture()

    admin = person_fixture_with_account(%{company_id: company.id, company_role: :admin})
    member = person_fixture_with_account(%{company_id: company.id, full_name: "Unique Name"})

    %{ admin: admin, member: member, company: company }
    end

    test "admin can remove members", ctx do
      admin = Operately.Repo.preload(ctx.admin, [:account])
      conn = log_in_account(ctx.conn, admin.account)

      conn = graphql(conn, @remove_company_member, "RemoveCompanyMember", %{ :personId => ctx.member.id })
      res = json_response(conn, 200)

      person = Operately.People.get_person_by_name!(ctx.company, ctx.member.full_name)

      assert Map.has_key?(res["data"]["removeCompanyMember"], "id")

      assert person != nil
      assert person.suspended
      assert person.suspended_at != nil
    end

    test "member can't remove members", ctx do
      member = Operately.Repo.preload(ctx.member, [:account])
      conn = log_in_account(ctx.conn, member.account)

      conn = graphql(conn, @remove_company_member, "RemoveCompanyMember", %{ :personId => ctx.member.id })
      res = json_response(conn, 200)

      assert res["errors"] |> List.first() |> Map.get("message") == "Only admins can remove members"
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
