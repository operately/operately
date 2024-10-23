defmodule OperatelyWeb.Api.Mutations.AddCompanyAdminsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_company_admins, %{})
    end
  end

  describe "permissions" do
    setup :register_and_log_in_account

    test "company members with full access can add new admins", ctx do
      person = person_fixture(%{company_id: ctx.company.id})

      assert {403, res} = mutation(ctx.conn, :add_company_admins, %{
        people_ids: [Paths.person_id(person)],
      })
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can add new admins", ctx do
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = mutation(conn, :add_company_admins, %{
        people_ids: [Paths.person_id(ctx.person)],
      })
    end

    test "company members with non-admin roles can't add new admins", ctx do
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = mutation(conn, :add_company_admins, %{
        people_ids: [Paths.person_id(ctx.person)],
      })
    end
  end

  describe "add_company_admins functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      account = Repo.preload(ctx.company_creator, :account).account

      %{ctx | conn: log_in_account(ctx.conn, account)}
    end

    test "adds one admin", ctx do
      assert {200, _} = mutation(ctx.conn, :add_company_admins, %{
        people_ids: [Paths.person_id(ctx.person)],
      })
    end

    test "adds multiple members", ctx do
      people = Enum.map(1..3, fn _ -> person_fixture(%{company_id: ctx.company.id}) end)

      assert {200, _} = mutation(ctx.conn, :add_company_admins, %{
        people_ids: Enum.map(people, &(Paths.person_id(&1))),
      })
    end
  end
end
