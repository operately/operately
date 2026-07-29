defmodule Operately.Search.CoreWorkIndexUpdatesTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Ecto.Multi
  alias Operately.Search.CoreWorkIndexUpdates
  alias Operately.Search.IndexUpdates.Worker
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project_check_in(:project_check_in, :project, :creator)
      |> Factory.add_goal_update(:goal_check_in, :goal, :creator)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)

    Repo.delete_all(Oban.Job)
    ctx
  end

  test "transactionally enqueues every indexed child owned by a project", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, _changes} =
               Multi.new()
               |> Multi.put(:project, ctx.project)
               |> CoreWorkIndexUpdates.enqueue_project(fn changes -> changes.project.id end)
               |> Repo.transaction()
    end)

    assert_enqueued(
      worker: Worker,
      args: %{
        source_type: "project_check_in",
        source_ids: [ctx.project_check_in.id]
      }
    )

    assert_enqueued(
      worker: Worker,
      args: %{
        source_type: "project_retrospective",
        source_ids: [ctx.retrospective.id]
      }
    )
  end

  test "transactionally enqueues every indexed child owned by a goal", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, _changes} =
               Multi.new()
               |> CoreWorkIndexUpdates.enqueue_goal(ctx.goal.id)
               |> Repo.transaction()
    end)

    assert_enqueued(
      worker: Worker,
      args: %{
        source_type: "goal_check_in",
        source_ids: [ctx.goal_check_in.id]
      }
    )
  end

  test "refresh jobs roll back with the canonical transaction", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:error, :forced_failure, :rollback, _changes} =
               Multi.new()
               |> CoreWorkIndexUpdates.enqueue_project(ctx.project.id)
               |> Multi.run(:forced_failure, fn _repo, _changes -> {:error, :rollback} end)
               |> Repo.transaction()
    end)

    refute_enqueued(worker: Worker)
  end
end
