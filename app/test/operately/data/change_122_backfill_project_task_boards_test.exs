defmodule Operately.Data.Change122BackfillProjectTaskBoardsTest do
  use Operately.DataCase

  alias Operately.Data.Change122BackfillProjectTaskBoards, as: Change
  alias Operately.Projects.Milestone
  alias Operately.Tasks.Task
  alias OperatelyWeb.Paths

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
  end

  test "copies exact project workflow and ordering, changing only task board references", ctx do
    ctx =
      ctx
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)
      |> Factory.add_project_task(:root_task, nil, project_id: ctx.project.id)
      |> Factory.add_project_task(:archived_task, :milestone)

    ctx.archived_task |> change(archived_at: ~N[2020-01-01 00:00:00]) |> Repo.update!()
    statuses = [%{"id" => "custom-status", "label" => "Review", "color" => "blue", "value" => "review", "index" => 0, "closed" => false, "legacy" => "preserved"}]
    ordering = %{"review" => [Paths.task_id(ctx.root_task), Paths.task_id(ctx.task)], "legacy" => ["old-id"]}
    timestamps = [inserted_at: ~N[2020-01-01 00:00:00], updated_at: ~N[2021-01-01 00:00:00]]
    from(p in Change.Project, where: p.id == ^ctx.project.id) |> Repo.update_all(set: timestamps ++ [task_statuses: statuses, tasks_kanban_state: ordering])
    from(t in Task, where: t.project_id == ^ctx.project.id) |> Repo.update_all(set: timestamps)
    ctx.milestone |> change(tasks_ordering_state: [Paths.task_id(ctx.task)], tasks_kanban_state: %{"todo" => [Paths.task_id(ctx.archived_task)]}) |> Repo.update!()

    project_before = Repo.reload!(ctx.project)
    milestone_before = Repo.reload!(ctx.milestone)
    tasks_before = Repo.all(from t in Task, where: t.project_id == ^ctx.project.id)

    assert :ok = Change.run()

    board = Repo.get_by!(Change.Board, project_id: ctx.project.id)
    assert board.space_id == nil
    assert board.name == "Tasks"
    assert board.position == 0
    assert board.archived_at == nil
    assert board.task_statuses == statuses
    assert board.tasks_kanban_state == ordering
    assert board.inserted_at == project_before.inserted_at
    assert board.updated_at == project_before.updated_at
    assert Repo.reload!(ctx.project) == project_before
    assert Repo.reload!(ctx.milestone) == milestone_before

    for task <- tasks_before do
      updated = Repo.reload!(task)
      assert updated.board_id == board.id
      assert %{updated | board_id: nil} == task
    end
  end

  test "includes empty, closed, and soft-deleted projects without changing space boards or tasks", ctx do
    ctx =
      ctx
      |> Factory.add_project(:closed, :space)
      |> Factory.add_project(:deleted, :space)

    ctx = Factory.add_project_task(ctx, :deleted_task, nil, project_id: ctx.deleted.id)
    ctx.closed |> change(status: "closed", closed_at: ~U[2021-01-01 00:00:00Z]) |> Repo.update!()
    Repo.soft_delete!(ctx.deleted)
    ctx = Factory.create_space_task(ctx, :space_task, :space)
    space_boards = Repo.all(from b in Change.Board, where: not is_nil(b.space_id), order_by: b.id)
    space_task = Repo.reload!(ctx.space_task)

    assert :ok = Change.run()

    for project <- [ctx.project, ctx.closed, ctx.deleted] do
      assert Repo.get_by!(Change.Board, project_id: project.id).archived_at == nil
    end

    assert Repo.reload!(ctx.deleted_task).board_id == Repo.get_by!(Change.Board, project_id: ctx.deleted.id).id
    assert Repo.reload!(ctx.space_task) == space_task
    assert Repo.all(from b in Change.Board, where: not is_nil(b.space_id), order_by: b.id) == space_boards
  end

  test "reruns preserve existing boards and assignments and fill missing assignments", ctx do
    ctx = ctx |> Factory.add_project_task(:assigned, nil, project_id: ctx.project.id) |> Factory.add_project_task(:unassigned, nil, project_id: ctx.project.id)
    board = Repo.insert!(%Change.Board{project_id: ctx.project.id, name: "Existing", position: 0, task_statuses: [], tasks_kanban_state: %{"custom" => []}})
    ctx.assigned |> change(board_id: board.id) |> Repo.update!()

    assert :ok = Change.run()
    assert Repo.reload!(ctx.unassigned).board_id == board.id
    snapshot = snapshot()
    from(p in Change.Project, where: p.id == ^ctx.project.id) |> Repo.update_all(set: [tasks_kanban_state: %{"changed" => []}])

    assert :ok = Change.run()
    assert snapshot() == snapshot
    assert Repo.get!(Change.Board, board.id) == board
  end

  test "preserves null legacy workflow and ordering", ctx do
    from(p in Change.Project, where: p.id == ^ctx.project.id) |> Repo.update_all(set: [task_statuses: nil, tasks_kanban_state: nil])

    assert :ok = Change.run()
    board = Repo.get_by!(Change.Board, project_id: ctx.project.id)
    assert board.task_statuses == nil
    assert board.tasks_kanban_state == nil
  end

  test "validation rejects missing project boards and missing project task assignments", ctx do
    assert_raise RuntimeError, ~r/Project task board cutover failed/, fn -> Change.validate!() end
    assert :ok = Change.run()
    ctx = Factory.add_project_task(ctx, :task, nil, project_id: ctx.project.id)
    assert ctx.task.board_id == nil
    assert_raise RuntimeError, ~r/Project task board cutover failed/, fn -> Change.validate!() end
  end

  test "rejects cross-project task assignments and rolls back the entire backfill", ctx do
    ctx = ctx |> Factory.add_project(:other, :space) |> Factory.add_project_task(:task, nil, project_id: ctx.project.id)
    board = Repo.insert!(%Change.Board{project_id: ctx.other.id, name: "Other", position: 0})
    ctx.task |> change(board_id: board.id) |> Repo.update!()
    before = snapshot()

    assert_raise RuntimeError, ~r/Project task board cutover failed/, fn -> Change.run() end
    assert snapshot() == before
  end

  test "rejects project tasks assigned to space boards", ctx do
    ctx = Factory.add_project_task(ctx, :task, nil, project_id: ctx.project.id)
    ctx.task |> change(board_id: ctx.space.default_task_board_id) |> Repo.update!()
    assert_raise RuntimeError, ~r/Project task board cutover failed/, fn -> Change.run() end
  end

  test "rejects space tasks assigned to project boards", ctx do
    assert :ok = Change.run()
    ctx = Factory.create_space_task(ctx, :task, :space)
    board = Repo.get_by!(Change.Board, project_id: ctx.project.id)
    ctx.task |> change(board_id: board.id) |> Repo.update!()
    assert_raise RuntimeError, ~r/Project task board cutover failed/, fn -> Change.validate!() end
  end

  test "rejects independently archived project boards", ctx do
    assert :ok = Change.run()
    from(b in Change.Board, where: b.project_id == ^ctx.project.id) |> Repo.update_all(set: [archived_at: ~N[2020-01-01 00:00:00]])
    assert_raise RuntimeError, ~r/Project task board cutover failed/, fn -> Change.validate!() end
  end

  test "schema requires exactly one existing owner and at most one board per project", ctx do
    assert_board_constraint(%{}, "task_boards_requires_owner")
    assert_board_constraint(%{space_id: ctx.space.id, project_id: ctx.project.id}, "task_boards_requires_owner")
    assert_board_constraint(%{project_id: Ecto.UUID.generate()}, "task_boards_project_id_fkey")
    Repo.insert!(%Change.Board{project_id: ctx.project.id, name: "Tasks", position: 0})
    assert_board_constraint(%{project_id: ctx.project.id}, "task_boards_project_id_index")
  end

  test "task board references allow either owner type but reject ambiguous or missing owners", ctx do
    ctx = Factory.add_project_task(ctx, :task, nil, project_id: ctx.project.id)
    board = Repo.insert!(%Change.Board{project_id: ctx.project.id, name: "Tasks", position: 0})
    task = ctx.task |> change(board_id: board.id) |> Repo.update!()

    for attrs <- [%{space_id: ctx.space.id}, %{project_id: nil}] do
      assert_raise Ecto.ConstraintError, ~r/tasks_board_requires_owner/, fn ->
        task |> change(attrs) |> Repo.update!(mode: :savepoint)
      end
    end
  end

  test "schema upgrade and rollback preserve populated data and do not invoke the backfill", ctx do
    ctx = Factory.add_project_task(ctx, :task, nil, project_id: ctx.project.id)
    before = snapshot()
    run_schema_migration(:down)

    assert_raise Ecto.ConstraintError, ~r/tasks_board_requires_space/, fn ->
      ctx.task |> change(board_id: ctx.space.default_task_board_id) |> Repo.update!(mode: :savepoint)
    end

    run_schema_migration(:up)
    assert snapshot() == before
    refute Repo.exists?(from b in Change.Board, where: not is_nil(b.project_id))
    assert Repo.reload!(ctx.task).board_id == nil
  end

  test "schema rollback refuses to discard even empty project boards" do
    assert :ok = Change.run()
    before = snapshot()

    assert_raise Postgrex.Error, ~r/space_id.*null values/, fn ->
      Repo.transaction(fn -> run_schema_migration(:down) end)
    end

    assert snapshot() == before
  end

  defp run_schema_migration(direction) do
    migration = Operately.Repo.Migrations.PrepareProjectTaskBoards

    unless Code.ensure_loaded?(migration) do
      Code.require_file("priv/repo/migrations/20261112181313_prepare_project_task_boards.exs")
    end

    Ecto.Migration.Runner.run(Repo, Repo.config(), 20_261_112_181_313, migration, :forward, direction, direction, log: false)
  end

  defp assert_board_constraint(attrs, constraint) do
    board = struct!(Change.Board, Map.merge(%{name: "Tasks", position: 0}, attrs))
    assert_raise Ecto.ConstraintError, ~r/#{constraint}/, fn -> Repo.insert!(board, mode: :savepoint) end
  end

  defp snapshot do
    for schema <- [Change.Board, Task, Milestone], into: %{} do
      {schema, Repo.all(from r in schema, order_by: r.id)}
    end
  end
end
