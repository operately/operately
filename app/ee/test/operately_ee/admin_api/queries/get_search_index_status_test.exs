defmodule OperatelyEE.AdminApi.Queries.GetSearchIndexStatusTest do
  use OperatelyWeb.TurboCase

  alias Operately.People.Account
  alias Operately.Search.IndexRun

  describe "security" do
    test "requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_query(ctx.conn, :get_search_index_status, %{})
    end

    test "requires a site administrator", ctx do
      ctx = Factory.setup(ctx) |> Factory.log_in_account(:account)
      assert {401, "Unauthorized"} = admin_query(ctx.conn, :get_search_index_status, %{})
    end
  end

  describe "functionality" do
    setup :log_in_site_admin

    test "returns every registered source and its latest run", ctx do
      completed_at = DateTime.utc_now()

      run =
        %{
          source_type: "project",
          kind: :backfill,
          status: :completed_with_errors,
          phase: :source_scan,
          processed_count: 12,
          inserted_count: 7,
          updated_count: 2,
          unchanged_count: 1,
          superseded_count: 1,
          skipped_count: 1,
          failed_count: 1,
          deleted_orphan_count: 0,
          last_error: "invalid_source",
          started_at: DateTime.add(completed_at, -10, :second),
          completed_at: completed_at
        }
        |> IndexRun.changeset()
        |> Repo.insert!()

      assert {200, %{sources: sources}} = admin_query(ctx.conn, :get_search_index_status, %{})
      assert length(sources) == 13

      project = Enum.find(sources, &(&1.source_type == "project"))
      assert project.latest_run.id == run.id
      assert project.latest_run.kind == "backfill"
      assert project.latest_run.status == "completed_with_errors"
      assert project.latest_run.phase == "source_scan"
      assert project.latest_run.processed_count == 12
      assert project.latest_run.inserted_count == 7
      assert project.latest_run.failed_count == 1
      assert project.latest_run.last_error == "invalid_source"

      assert %{latest_run: nil} = Enum.find(sources, &(&1.source_type == "goal"))
    end
  end

  defp log_in_site_admin(ctx) do
    ctx = Factory.setup(ctx)
    {:ok, _account} = Account.promote_to_admin(ctx.account)

    ctx
    |> Map.put(:account, Repo.get!(Account, ctx.account.id))
    |> Factory.log_in_account(:account)
  end
end
