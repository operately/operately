defmodule OperatelyWeb.Api.CompanyTransfers.ListExportRunsTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:company_transfers, :list_export_runs], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.add_company_member(:owner)
    end

    test "company member cannot list export runs", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      assert {403, res} = query(ctx.conn, [:company_transfers, :list_export_runs], %{})

      assert res.message == "You don't have permission to perform this action"
    end

    test "company owner can list export runs", ctx do
      Operately.Companies.add_owner(ctx.creator, ctx.owner.id)
      ctx = Factory.log_in_person(ctx, :owner)

      assert {200, res} = query(ctx.conn, [:company_transfers, :list_export_runs], %{})

      assert res.export_runs == []
    end
  end

  describe "list_export_runs functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:owner)
      |> Factory.preload(:owner, :account)
      |> Factory.log_in_person(:owner)
    end

    test "returns empty list when no exports exist", ctx do
      Operately.Companies.add_owner(ctx.creator, ctx.owner.id)

      assert {200, res} = query(ctx.conn, [:company_transfers, :list_export_runs], %{})

      assert res.export_runs == []
    end

    test "returns list of export runs for the company", ctx do
      Operately.Companies.add_owner(ctx.creator, ctx.owner.id)

      {:ok, run1} = Operately.CompanyTransfers.create_export_run(ctx.company, ctx.owner.account)
      {:ok, run2} = Operately.CompanyTransfers.create_export_run(ctx.company, ctx.owner.account)

      assert {200, res} = query(ctx.conn, [:company_transfers, :list_export_runs], %{})

      assert length(res.export_runs) == 2
      ids = Enum.map(res.export_runs, & &1.id)
      assert run1.id in ids
      assert run2.id in ids
    end

    test "does not return export runs from other companies", ctx do
      Operately.Companies.add_owner(ctx.creator, ctx.owner.id)

      {:ok, _run1} = Operately.CompanyTransfers.create_export_run(ctx.company, ctx.owner.account)

      other_ctx =
        Factory.setup(%{})
        |> Factory.add_company_member(:owner)
        |> Factory.preload(:owner, :account)

      {:ok, _run2} = Operately.CompanyTransfers.create_export_run(other_ctx.company, other_ctx.owner.account)

      assert {200, res} = query(ctx.conn, [:company_transfers, :list_export_runs], %{})

      assert length(res.export_runs) == 1
    end
  end
end
