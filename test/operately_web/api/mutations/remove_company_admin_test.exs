defmodule OperatelyWeb.Api.Mutations.RemoveCompanyAdminTest do
  use OperatelyWeb.TurboCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias OperatelyWeb.Paths
  alias Operately.Companies

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :remove_company_admin, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      admin = person_fixture_with_account(%{company_id: ctx.company.id})

      Companies.add_admins(ctx.company_creator, ctx.company, [ctx.person.id, admin.id])

      Map.merge(ctx, %{admin: admin})
    end

    test "company members without full access can't add admins", ctx do
      Companies.remove_admin(ctx.company_creator, ctx.person)
      assert {403, res} = request(ctx.conn, ctx.admin)

      assert res.message == "You don't have permission to perform this action"
      assert_is_admin(ctx.company, ctx.admin)
    end

    test "company admins can remove other admins", ctx do
      assert {200, res} = request(ctx.conn, ctx.admin)

      assert res.person == Serializer.serialize(ctx.admin)
      refute_is_admin(ctx.company, ctx.admin)
    end

    test "admins from other companies are not found", ctx do
      company = company_fixture()
      admin = hd(Companies.list_account_owners(company))

      assert {404, res} = request(ctx.conn, admin)
      assert res.message == "The requested resource was not found"
    end
  end

  describe "remove_company_admin functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      admin = person_fixture_with_account(%{company_id: ctx.company.id})

      Companies.add_admins(ctx.company_creator, ctx.company, [ctx.person.id, admin.id])

      Map.merge(ctx, %{admin: admin})
    end

    test "removes admin", ctx do
      assert_is_admin(ctx.company, ctx.admin)

      assert {200, res} = request(ctx.conn, ctx.admin)

      assert res.person == Serializer.serialize(ctx.admin)
      refute_is_admin(ctx.company, ctx.admin)
    end

    test "admins can't remove themselves", ctx do
      assert {400, res} = request(ctx.conn, ctx.person)

      assert res == %{error: "Bad request", message: "Admins cannot remove themselves"}
      assert_is_admin(ctx.company, ctx.person)
    end
  end

  #
  # Steps
  #

  defp request(conn, person) do
    mutation(conn, :remove_company_admin, %{person_id: Paths.person_id(person)})
  end

  defp assert_is_admin(company, person) do
    admins = Companies.list_account_owners(company)
    assert Enum.find(admins, &(&1.id == person.id))
  end

  defp refute_is_admin(company, person) do
    admins = Companies.list_account_owners(company)
    refute Enum.find(admins, &(&1.id == person.id))
  end
end
