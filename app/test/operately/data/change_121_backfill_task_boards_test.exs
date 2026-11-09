defmodule Operately.Data.Change121BackfillTaskBoardsTest do
  use Operately.DataCase

  alias Operately.Data.Change121BackfillTaskBoards, as: Change
  alias Operately.Groups.Group
  alias Operately.Tasks.{Task, TaskBoard}

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space)
  end

  test "copies exact status payloads and ordering without changing tasks or timestamps", ctx do
    ctx = ctx |> Factory.create_space_task(:task, :space) |> Factory.create_space_task(:archived, :space)
    ctx.archived |> change(archived_at: ~N[2020-01-01 00:00:00]) |> Repo.update!()
    statuses = [%{"id" => "custom-status", "label" => "Review", "color" => "blue", "value" => "review", "index" => 0, "closed" => false, "legacy" => "preserved"}]
    ordering = %{"review" => [OperatelyWeb.Paths.task_id(ctx.archived), OperatelyWeb.Paths.task_id(ctx.task)], "legacy" => ["old-id"]}
    timestamps = [inserted_at: ~N[2020-01-01 00:00:00], updated_at: ~N[2021-01-01 00:00:00]]
    from(s in Change.Space, where: s.id == ^ctx.space.id) |> Repo.update_all(set: timestamps ++ [task_statuses: statuses, tasks_kanban_state: ordering])
    from(t in Task, where: t.space_id == ^ctx.space.id) |> Repo.update_all(set: timestamps)
    space_before = Repo.get!(Change.Space, ctx.space.id)
    tasks_before = Repo.all(from t in Task, where: t.space_id == ^ctx.space.id)

    Change.run()

    space = Repo.get!(Change.Space, ctx.space.id)
    board = Repo.get!(Change.Board, space.default_task_board_id)
    assert board.task_statuses == statuses
    assert board.tasks_kanban_state == ordering
    assert board.name == "Tasks"
    assert board.position == 0
    assert board.archived_at == nil
    assert board.inserted_at == space_before.inserted_at
    assert board.updated_at == space_before.updated_at
    assert %{space | default_task_board_id: nil} == space_before

    for task <- tasks_before do
      updated = Repo.reload!(task)
      assert updated.board_id == board.id
      assert %{updated | board_id: nil} == task
    end
  end

  test "includes empty, disabled, and soft-deleted spaces while leaving project tasks alone", ctx do
    ctx =
      ctx
      |> Factory.set_space_tools(:space, tasks_enabled: false)
      |> Factory.add_space(:deleted_space)
      |> Factory.create_space_task(:deleted_space_task, :deleted_space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:project_task, :milestone)

    Repo.soft_delete!(ctx.deleted_space)
    project_task = Repo.reload!(ctx.project_task)

    Change.run()

    for space <- [ctx.space, ctx.deleted_space] do
      updated = Repo.get!(Group, space.id, with_deleted: true)
      assert Repo.get!(TaskBoard, updated.default_task_board_id).space_id == space.id
    end

    assert Repo.reload!(ctx.deleted_space_task).board_id != nil
    assert Repo.reload!(ctx.project_task) == project_task
    refute Repo.reload!(ctx.space).tools.tasks_enabled
  end

  test "preserves existing defaults and assignments and does not overwrite board state on reruns", ctx do
    ctx = ctx |> Factory.create_space_task(:assigned, :space) |> Factory.create_space_task(:unassigned, :space)
    default = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Existing default", tasks_kanban_state: %{"custom" => []}})
    other = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Other", position: 1})
    ctx.space |> change(default_task_board_id: default.id) |> Repo.update!()
    ctx.assigned |> change(board_id: other.id) |> Repo.update!()

    Change.run()
    boards = Repo.all(TaskBoard)
    tasks = Repo.all(Task)
    ctx.space |> change(tasks_kanban_state: %{"changed" => []}) |> Repo.update!()
    Change.run()

    assert Repo.reload!(ctx.space).default_task_board_id == default.id
    assert Repo.reload!(ctx.assigned).board_id == other.id
    assert Repo.reload!(ctx.unassigned).board_id == default.id
    assert Enum.sort_by(Repo.all(TaskBoard), & &1.id) == Enum.sort_by(boards, & &1.id)
    assert Enum.sort_by(Repo.all(Task), & &1.id) == Enum.sort_by(tasks, & &1.id)
    assert Repo.reload!(default) == default
  end

  test "preserves null legacy statuses and ordering", ctx do
    from(s in Change.Space, where: s.id == ^ctx.space.id) |> Repo.update_all(set: [task_statuses: nil, tasks_kanban_state: nil])

    Change.run()

    space = Repo.get!(Change.Space, ctx.space.id)
    board = Repo.get!(Change.Board, space.default_task_board_id)
    assert board.task_statuses == nil
    assert board.tasks_kanban_state == nil
  end
end
