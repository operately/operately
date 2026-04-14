defmodule OperatelyWeb.Api.CompanyTransfers.GetImportRunTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:company_transfers, :get_import_run], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.preload(:member, :account)
      |> Factory.add_company_member(:other_member)
      |> Factory.preload(:other_member, :account)
      |> Factory.log_in_person(:member)
    end

    test "user can get their own import run", ctx do
      {:ok, run} = Operately.CompanyTransfers.create_import_run(ctx.member.account, %{}, dispatch: false)

      assert {200, res} = query(ctx.conn, [:company_transfers, :get_import_run], %{
        id: run.id
      })

      assert res.import_run.id == run.id
      assert res.import_run.status == "pending"
    end

    test "user cannot get another user's import run", ctx do
      {:ok, run} = Operately.CompanyTransfers.create_import_run(ctx.other_member.account, %{}, dispatch: false)

      assert {403, res} = query(ctx.conn, [:company_transfers, :get_import_run], %{
        id: run.id
      })

      assert res.message == "You don't have permission to perform this action"
    end
  end

  describe "get_import_run functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.preload(:member, :account)
      |> Factory.log_in_person(:member)
    end

    test "returns import run details", ctx do
      {:ok, run} = Operately.CompanyTransfers.create_import_run(ctx.member.account, %{}, dispatch: false)

      assert {200, res} = query(ctx.conn, [:company_transfers, :get_import_run], %{
        id: run.id
      })

      assert res.import_run.id == run.id
      assert res.import_run.status == "pending"
      assert res.import_run.inserted_at
    end

    test "returns 404 for non-existent import run", ctx do
      assert {404, res} = query(ctx.conn, [:company_transfers, :get_import_run], %{
        id: Ecto.UUID.generate()
      })

      assert res.message == "The requested resource was not found"
    end
  end
end
