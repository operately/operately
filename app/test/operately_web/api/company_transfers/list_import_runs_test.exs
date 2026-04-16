defmodule OperatelyWeb.Api.CompanyTransfers.ListImportRunsTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:company_transfers, :list_import_runs], %{})
    end
  end

  describe "list_import_runs functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.preload(:member, :account)
      |> Factory.log_in_person(:member)
    end

    test "returns empty list when no imports exist", ctx do
      assert {200, res} = query(ctx.conn, [:company_transfers, :list_import_runs], %{})

      assert res.import_runs == []
    end

    test "returns list of import runs for the current account", ctx do
      {:ok, run1} = Operately.CompanyTransfers.create_import_run(ctx.member.account, %{})

      {:ok, run2} = Operately.CompanyTransfers.create_import_run(ctx.member.account, %{})

      assert {200, res} = query(ctx.conn, [:company_transfers, :list_import_runs], %{})

      assert length(res.import_runs) == 2
      ids = Enum.map(res.import_runs, & &1.id)
      assert run1.id in ids
      assert run2.id in ids
    end

    test "includes company when present and nil otherwise", ctx do
      {:ok, completed_run} =
        Operately.CompanyTransfers.create_import_run(ctx.member.account, %{
          company_id: ctx.company.id,
          status: :completed
        })

      {:ok, pending_run} = Operately.CompanyTransfers.create_import_run(ctx.member.account, %{})

      assert {200, res} = query(ctx.conn, [:company_transfers, :list_import_runs], %{})

      completed = Enum.find(res.import_runs, &(&1.id == completed_run.id))
      pending = Enum.find(res.import_runs, &(&1.id == pending_run.id))

      assert completed.company.id == OperatelyWeb.Paths.company_id(ctx.company)
      assert completed.company.name == ctx.company.name
      assert pending.company == nil
    end

    test "does not return import runs from other accounts", ctx do
      {:ok, _run1} = Operately.CompanyTransfers.create_import_run(ctx.member.account, %{})

      other_ctx =
        Factory.setup(%{})
        |> Factory.preload(:creator, :account)

      {:ok, _run2} = Operately.CompanyTransfers.create_import_run(other_ctx.creator.account, %{})

      assert {200, res} = query(ctx.conn, [:company_transfers, :list_import_runs], %{})

      assert length(res.import_runs) == 1
    end
  end
end
