defmodule OperatelyWeb.Api.Queries.GetGoalsTest do
  use OperatelyWeb.TurboCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.People.Person
  alias Operately.Companies.Company

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_companies, %{})
    end
  end

  describe "get_companies functionality" do
    setup :register_and_log_in_account

    test "get companies with nothing extra", ctx do
      company1 = company_fixture(name: "Acmecorp")
      company2 = company_fixture(name: "Dunder Mifflin")

      add_as_admin(ctx.person, company1)
      add_as_admin(ctx.person, company2)

      company1 = Operately.Repo.preload(company1, [:people])
      company2 = Operately.Repo.preload(company2, [:people])

      person_fixture(company_id: company1.id)
      person_fixture(company_id: company1.id)
      person_fixture(company_id: company2.id)

      assert {200, res} = query(ctx.conn, :get_companies, %{})
      assert length(res.companies) == 3
      assert find_in_response(res, ctx.company) == Serializer.serialize(ctx.company, level: :full)
      assert find_in_response(res, company1) == Serializer.serialize(company1, level: :full)
      assert find_in_response(res, company2) == Serializer.serialize(company2, level: :full)
    end

    test "include_member_count", ctx do
      company1 = company_fixture(name: "Acmecorp")
      company2 = company_fixture(name: "Dunder Mifflin")

      add_as_admin(ctx.person, company1)
      add_as_admin(ctx.person, company2)

      person_fixture(company_id: company1.id)
      person_fixture(company_id: company1.id)
      person_fixture(company_id: company2.id)

      assert {200, res} = query(ctx.conn, :get_companies, %{include_member_count: true})
      assert length(res.companies) == 3

      # reload companies with member count so that we can compare the serialized response
      [c1, c2, c3] = 
        [ctx.company, company1, company2] 
        |> Enum.map(fn c -> Operately.Companies.get_company!(c.id) end)
        |> Company.load_member_count()
      
      assert find_in_response(res, ctx.company) == Serializer.serialize(c1, level: :full)
      assert find_in_response(res, company1) == Serializer.serialize(c2, level: :full)
      assert find_in_response(res, company2) == Serializer.serialize(c3, level: :full)
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
      company_role: :admin,
    })

    {:ok, _} = Operately.Repo.insert(changeset)
  end
end
