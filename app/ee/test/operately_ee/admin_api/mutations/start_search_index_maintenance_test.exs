defmodule OperatelyEE.AdminApi.Mutations.StartSearchIndexMaintenanceTest do
  use OperatelyWeb.TurboCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.People.Account
  alias Operately.Search.IndexRun

  describe "security" do
    test "requires authentication", ctx do
      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :start_search_index_maintenance, %{kind: "backfill", source_type: "project"})
    end

    test "requires a site administrator", ctx do
      ctx = Factory.setup(ctx) |> Factory.log_in_account(:account)

      assert {401, "Unauthorized"} =
               admin_mutation(ctx.conn, :start_search_index_maintenance, %{kind: "backfill", source_type: "project"})
    end
  end

  describe "functionality" do
    setup :log_in_site_admin

    test "starts one source", ctx do
      Oban.Testing.with_testing_mode(:manual, fn ->
        assert {200, %{started_source_types: ["project"], already_running_source_types: []}} =
                 admin_mutation(ctx.conn, :start_search_index_maintenance, %{kind: "backfill", source_type: "project"})

        assert Repo.get_by!(IndexRun, source_type: :project).kind == :backfill
      end)
    end

    test "starts all idle sources and reports active ones", ctx do
      insert_active_run!("project")

      Oban.Testing.with_testing_mode(:manual, fn ->
        assert {200, result} = admin_mutation(ctx.conn, :start_search_index_maintenance, %{kind: "reconciliation"})
        assert "project" in result.already_running_source_types
        refute "project" in result.started_source_types
        assert length(result.started_source_types) == 12
      end)
    end

    test "returns a clear error for a single active source", ctx do
      insert_active_run!("project")

      assert {400, %{message: message}} =
               admin_mutation(ctx.conn, :start_search_index_maintenance, %{kind: "reconciliation", source_type: "project"})

      assert message == "Search index maintenance is already running for project"
    end

    test "rejects an unknown source", ctx do
      assert {400, %{error: "Bad request", message: message}} =
               admin_mutation(ctx.conn, :start_search_index_maintenance, %{kind: "backfill", source_type: "missing"})

      assert message =~ "Invalid value for enum search_index_source_type"
    end
  end

  defp insert_active_run!(source_type) do
    %{source_type: source_type, kind: :backfill, status: :running, phase: :source_scan, started_at: DateTime.utc_now()}
    |> IndexRun.changeset()
    |> Repo.insert!()
  end

  defp log_in_site_admin(ctx) do
    ctx = Factory.setup(ctx)
    {:ok, _account} = Account.promote_to_admin(ctx.account)

    ctx
    |> Map.put(:account, Repo.get!(Account, ctx.account.id))
    |> Factory.log_in_account(:account)
  end
end
