defmodule OperatelyWeb.Api.Queries.GetCompanyTest do
  use OperatelyWeb.TurboCase

  alias Operately.{Repo, People}

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_company, %{id: "1"})
    end

    test "suspended people don't have access", ctx do
      ctx = register_and_log_in_account(ctx)
      company = Serializer.serialize(ctx.company, level: :full)

      assert {200, res} = query(ctx.conn, :get_company, %{id: company.id})
      assert res.company == company

      People.update_person(ctx.person, %{suspended_at: DateTime.utc_now()})

      assert {404, res} = query(ctx.conn, :get_company, %{id: company.id})
      assert res.message == "The requested resource was not found"
    end
  end

  describe "get_company functionality" do
    setup :register_and_log_in_account

    test "only company", ctx do
      company = Serializer.serialize(ctx.company, level: :full)

      assert {200, res} = query(ctx.conn, :get_company, %{id: company.id})
      assert res.company == company
      refute res.company.admins
      refute res.company.people
    end

    test "include_admins", ctx do
      company =
        Repo.preload(ctx.company, :admins)
        |> Serializer.serialize(level: :full)

      assert {200, res} = query(ctx.conn, :get_company, %{id: company.id, include_admins: true})
      assert res.company == company
      assert res.company.admins
    end

    test "include_people", ctx do
      company =
        Repo.preload(ctx.company, :people)
        |> Serializer.serialize(level: :full)

      assert {200, res} = query(ctx.conn, :get_company, %{id: company.id, include_people: true})
      assert res.company == company
      assert res.company.people
    end
  end
end
