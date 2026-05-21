defmodule OperatelyWeb.Api.Companies.ListTest do
  use OperatelyWeb.TurboCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.People.Person

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:companies, :list], %{})
    end
  end

  describe "get_companies functionality" do
    setup :register_and_log_in_account

    test "get companies with nothing extra", ctx do
      company1 = company_fixture(name: "Acmecorp")
      company2 = company_fixture(name: "Dunder Mifflin")

      add_as_admin(ctx.person, company1)
      add_as_admin(ctx.person, company2)

      person_fixture(company_id: company1.id)
      person_fixture(company_id: company1.id)
      person_fixture(company_id: company2.id)

      assert {200, res} = query(ctx.conn, [:companies, :list], %{})
      assert length(res.companies) == 3
      assert find_in_response(res, ctx.company) == Serializer.serialize(ctx.company, level: :full)
      assert find_in_response(res, company1) == Serializer.serialize(company1, level: :full)
      assert find_in_response(res, company2) == Serializer.serialize(company2, level: :full)
    end

    test "include_member_count doesn't include suspended members", ctx do
      person_fixture(company_id: ctx.company.id)
      person_fixture(company_id: ctx.company.id, suspended_at: DateTime.utc_now())

      assert {200, res} = query(ctx.conn, [:companies, :list], %{include_member_count: true})
      assert length(res.companies) == 1

      assert hd(res.companies).member_count == 3
    end

    test "is_company_owner filters to only owned companies", ctx do
      # ctx.company is created by register_and_log_in_account with ctx.person as member (not owner)
      # Create another company where the logged-in user is a member but not owner
      other_company = company_fixture(name: "Other Corp")
      add_as_admin(ctx.person, other_company)

      # Add an owner to ctx.company
      owner = person_fixture_with_account(%{company_id: ctx.company.id})
      group = Operately.Access.get_group!(company_id: ctx.company.id, tag: :full_access)
      {:ok, _} = Operately.Access.add_to_group(group, person_id: owner.id)

      # Without filter, both companies are returned
      assert {200, res} = query(ctx.conn, [:companies, :list], %{})
      assert length(res.companies) == 2

      # With is_company_owner: true, only owned companies are returned
      # The logged-in user (ctx.person) is not an owner of any company
      assert {200, res} = query(ctx.conn, [:companies, :list], %{is_company_owner: true})
      assert length(res.companies) == 0
    end

    test "is_company_owner returns owned companies for company creator", ctx do
      # The company creator from register_and_log_in_account is an owner
      assert {200, res} = query(ctx.conn, [:companies, :list], %{is_company_owner: true})
      # ctx.person is not owner, so 0 results
      assert length(res.companies) == 0

      # Make ctx.person an owner of ctx.company
      group = Operately.Access.get_group!(company_id: ctx.company.id, tag: :full_access)
      {:ok, _} = Operately.Access.add_to_group(group, person_id: ctx.person.id)

      assert {200, res} = query(ctx.conn, [:companies, :list], %{is_company_owner: true})
      assert length(res.companies) == 1
      assert hd(res.companies).id == OperatelyWeb.Paths.company_id(ctx.company)
    end
  end

  defp find_in_response(res, company) do
    Enum.find(res.companies, fn c -> c.id == OperatelyWeb.Paths.company_id(company) end)
  end

  defp add_as_admin(person, company) do
    account = Operately.People.get_account!(person.account_id)
    changeset = Person.changeset(%{
      company_id: company.id,
      account_id: account.id,
      full_name: "John Doe",
      email: "john@jobh.com",
      avatar_url: "",
      title: "COO",
    })

    {:ok, _} = Operately.Repo.insert(changeset)
  end
end
