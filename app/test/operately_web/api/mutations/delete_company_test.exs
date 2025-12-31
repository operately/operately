defmodule OperatelyWeb.Api.Mutations.DeleteCompanyTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Person
  alias Operately.People.Account
  alias Operately.Companies.Company

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :delete_company, %{})
    end
  end

  describe "permissions" do
    setup :register_and_log_in_account

    test "company members cannot delete company", ctx do
      assert {403, _} = mutation(ctx.conn, :delete_company, %{})
    end

    test "company admins cannot delete company", ctx do
      # Promote to admin
      {:ok, _} = Operately.Operations.CompanyAdminAdding.run(ctx.company_creator, ctx.person.id)

      assert {403, _} = mutation(ctx.conn, :delete_company, %{})
    end

    test "company owners can delete company", ctx do
      # Promote to owner
      {:ok, _} = Operately.Operations.CompanyOwnersAdding.run(ctx.company_creator, ctx.person.id)

      assert {200, res} = mutation(ctx.conn, :delete_company, %{})
      assert res.success

      refute Repo.get(Company, ctx.company.id)
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      {:ok, _} = Operately.Operations.CompanyOwnersAdding.run(ctx.company_creator, ctx.person.id)
      ctx
    end

    test "deletes company and cascades people but keeps accounts", ctx do
      # Create another person in the same company
      other_person = person_fixture_with_account(%{company_id: ctx.company.id})

      # Create unrelated company
      other_company = company_fixture(%{name: "Other Inc"})
      other_company_person = person_fixture_with_account(%{company_id: other_company.id})

      assert {200, _} = mutation(ctx.conn, :delete_company, %{})

      # Company is gone
      refute Repo.get(Company, ctx.company.id)

      # People in the company are gone
      refute Repo.get(Person, ctx.person.id)
      refute Repo.get(Person, other_person.id)

      # Accounts remain
      assert Repo.get(Account, ctx.account.id)
      assert Repo.get(Account, other_person.account_id)

      # Unrelated company and its people remain
      assert Repo.get(Company, other_company.id)
      assert Repo.get(Person, other_company_person.id)
    end
  end
end
