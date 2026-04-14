defmodule OperatelyWeb.Api.CompanyTransfers.StartExportTest do
  use OperatelyWeb.TurboCase
  use Oban.Testing, repo: Operately.Repo

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:company_transfers, :start_export], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.add_company_member(:admin)
      |> Factory.add_company_member(:owner)
    end

    test "company member cannot start export", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      assert {403, res} = mutation(ctx.conn, [:company_transfers, :start_export], %{})

      assert res.message == "You don't have permission to perform this action"
    end

    test "company admin cannot start export", ctx do
      ctx =
        ctx
        |> Factory.add_company_admin(:admin)
        |> Factory.log_in_person(:admin)

      assert {403, res} = mutation(ctx.conn, [:company_transfers, :start_export], %{})

      assert res.message == "You don't have permission to perform this action"
    end

    test "company owner can start export", ctx do
      ctx =
        ctx
        |> Factory.add_company_owner(:owner)
        |> Factory.log_in_person(:owner)

      assert {200, res} = mutation(ctx.conn, [:company_transfers, :start_export], %{})

      assert res.export_run.status == "pending"
      assert res.export_run.id
    end
  end

  describe "start_export functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_owner(:owner)
      |> Factory.log_in_person(:owner)
    end

    test "creates an export run", ctx do
      {:ok, res} = Oban.Testing.with_testing_mode(:manual, fn ->
        {200, res} = mutation(ctx.conn, [:company_transfers, :start_export], %{})
        {:ok, res}
      end)

      assert res.export_run.status == "pending"
      assert res.export_run.id

      run = Operately.CompanyTransfers.get_export_run(res.export_run.id)
      assert run.company_id == ctx.company.id
      assert run.requested_by_id == ctx.owner.account_id
      assert run.status == :pending
    end

    test "enqueues an export worker", ctx do
      {:ok, res} = Oban.Testing.with_testing_mode(:manual, fn ->
        {200, res} = mutation(ctx.conn, [:company_transfers, :start_export], %{})
        {:ok, res}
      end)

      jobs = all_enqueued(worker: Operately.CompanyTransfers.ExportWorker)
      assert length(jobs) == 1
      assert hd(jobs).args["export_run_id"] == res.export_run.id
    end
  end
end
