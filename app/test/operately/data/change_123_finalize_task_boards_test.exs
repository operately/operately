defmodule Operately.Data.Change123FinalizeTaskBoardsTest do
  use Operately.DataCase

  alias Operately.Data.Change123FinalizeTaskBoards, as: Change
  alias Operately.Projects.Project
  alias Operately.Tasks.Task

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone)
    |> Factory.create_space_task(:space_task, :space)
  end

  test "requires board references even when bypassing the task changeset", ctx do
    for task <- [ctx.task, ctx.space_task] do
      assert_raise Postgrex.Error, ~r/board_id.*not-null constraint/, fn ->
        task |> change(board_id: nil) |> Repo.update!(mode: :savepoint)
      end
    end
  end

  test "rollback restores current board payloads and upgrade preserves task and milestone ordering", ctx do
    board = Repo.get_by!(Change.Board, project_id: ctx.project.id)
    statuses = [%{"id" => "custom", "label" => "Review", "color" => "blue", "value" => "review", "index" => 0, "closed" => false, "extra" => "preserved"}]
    ordering = %{"review" => [OperatelyWeb.Paths.task_id(ctx.task)]}
    board |> change(task_statuses: statuses, tasks_kanban_state: ordering) |> Repo.update!()
    ctx.milestone |> change(tasks_kanban_state: ordering, tasks_ordering_state: ordering["review"]) |> Repo.update!()
    Repo.soft_delete!(ctx.project)
    ctx.task |> change(archived_at: ~N[2026-01-01 00:00:00]) |> Repo.update!()
    before = snapshot()

    migrate(:down)
    legacy = Repo.get!(Change.Project, ctx.project.id)
    assert legacy.task_statuses == statuses
    assert legacy.tasks_kanban_state == ordering
    assert snapshot() == before

    migrate(:up)
    assert snapshot() == before
    refute legacy_column_exists?()
  end

  test "rollback preserves explicit null board payloads", ctx do
    board = Repo.get_by!(Change.Board, project_id: ctx.project.id)
    board |> change(task_statuses: nil, tasks_kanban_state: nil) |> Repo.update!()
    migrate(:down)
    legacy = Repo.get!(Change.Project, ctx.project.id)
    assert legacy.task_statuses == nil
    assert legacy.tasks_kanban_state == nil
  end

  for owner <- [:task, :space_task] do
    @owner owner
    test "upgrade rejects missing board references on #{@owner} without dropping legacy storage", ctx do
      migrate(:down)
      ctx[@owner] |> change(board_id: nil) |> Repo.update!()

      assert_raise Postgrex.Error, ~r/board_id.*null values/, fn ->
        Repo.transaction(fn -> migrate(:up) end, mode: :savepoint)
      end

      assert legacy_column_exists?()
      assert Repo.reload!(ctx[@owner]).board_id == nil
    end
  end

  defp legacy_column_exists? do
    Repo.query!("SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'task_statuses'").num_rows == 1
  end

  defp snapshot do
    for schema <- [Project, Change.Board, Task, Operately.Projects.Milestone], into: %{} do
      {schema, Repo.all(from(r in schema, order_by: r.id), with_deleted: true)}
    end
  end

  defp migrate(direction) do
    module = Operately.Repo.Migrations.RemoveLegacyProjectTaskStorage
    unless Code.ensure_loaded?(module), do: Code.require_file("priv/repo/migrations/20261113165306_remove_legacy_project_task_storage.exs")
    Ecto.Migration.Runner.run(Repo, Repo.config(), 20_261_113_165_306, module, :forward, direction, direction, log: false)
  end
end
