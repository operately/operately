defmodule Operately.Search.IndexUpdatesTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Ecto.Multi
  alias Operately.Projects.Project
  alias Operately.Search.{Entry, IndexUpdates, SourceIndexer}
  alias Operately.Search.IndexUpdates.Worker
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)

    Repo.delete_all(Oban.Job)
    ctx
  end

  test "refresh jobs commit atomically and reload the latest source", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, %{project: project}} =
               Multi.new()
               |> Multi.update(:project, Project.changeset(ctx.project, %{name: "Committed name"}))
               |> IndexUpdates.enqueue(:search_project, "project", fn changes -> changes.project.id end)
               |> Repo.transaction()

      assert [job] = all_enqueued(worker: Worker)
      assert :ok = perform_job(Worker, job.args)
      assert Repo.get_by!(Entry, source_type: :project, source_id: project.id).title == "Committed name"
    end)
  end

  test "refresh jobs roll back with the canonical write", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:error, :stop, :deliberate_rollback, _changes} =
               Multi.new()
               |> Multi.update(:project, Project.changeset(ctx.project, %{name: "Rolled back"}))
               |> IndexUpdates.enqueue(:search_project, "project", fn changes -> changes.project.id end)
               |> Multi.run(:stop, fn _repo, _changes -> {:error, :deliberate_rollback} end)
               |> Repo.transaction()

      assert Repo.reload!(ctx.project).name != "Rolled back"
      refute_enqueued(worker: Worker)
    end)
  end

  test "scoped deletion removes every projected descendant", ctx do
    assert {:ok, _summary} = SourceIndexer.sync("project", ctx.project.id)
    assert {:ok, _summary} = SourceIndexer.sync("goal", ctx.goal.id)

    assert {:ok, %{deleted: 2}} =
             Multi.new()
             |> IndexUpdates.delete_scope(:deleted, :space_id, ctx.space.id)
             |> Repo.transaction()

    refute Repo.get_by(Entry, source_type: :project, source_id: ctx.project.id)
    refute Repo.get_by(Entry, source_type: :goal, source_id: ctx.goal.id)
  end
end
