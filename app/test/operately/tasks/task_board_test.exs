defmodule Operately.Tasks.TaskBoardTest do
  use Operately.DataCase

  alias Operately.Tasks.TaskBoard

  test "project creation and task creation assign the project's sole board", ctx do
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_task(ctx, :project_task, nil, project_id: ctx.project.id)
    assert ctx.project_task.board_id
    assert Repo.get!(TaskBoard, ctx.project_task.board_id).project_id == ctx.project.id
  end

  test "project boards inherit project access rather than the containing space", ctx do
    ctx = ctx |> Factory.add_space_member(:member, :space) |> Factory.add_project(:project, :space, company_access_level: 0, space_access_level: 0)
    board = Operately.Projects.Project.task_board(ctx.project)

    assert {:ok, _} = Operately.Groups.Group.get(ctx.member, id: ctx.space.id)
    assert {:error, :not_found} = TaskBoard.get(ctx.member, id: board.id)
    assert {:ok, authorized} = TaskBoard.get(ctx.creator, id: board.id)
    assert authorized.request_info.access_level == Operately.Access.Binding.full_access()
  end

  test "project workflow writes use the board and ignore stale legacy project fields", ctx do
    ctx = Factory.add_project(ctx, :project, :space)
    original = Repo.reload!(ctx.project)
    [status | _] = original.task_statuses
    attrs = %{task_statuses: [%{Map.from_struct(status) | label: "Review"}], tasks_kanban_state: %{status.value => ["legacy-order"]}}

    assert {:ok, updated} = Operately.Projects.update_project(ctx.project, attrs)
    assert Repo.reload!(ctx.project).task_statuses == original.task_statuses
    assert Repo.reload!(ctx.project).tasks_kanban_state == original.tasks_kanban_state
    assert Operately.Projects.Project.task_statuses(updated) |> hd() |> Map.fetch!(:label) == "Review"
    assert Operately.Projects.Project.tasks_kanban_state(Repo.reload!(ctx.project)) == attrs.tasks_kanban_state
    serialized = OperatelyWeb.Api.Serializer.serialize(Repo.reload!(ctx.project), level: :full)
    assert hd(serialized.task_statuses).label == "Review"
    ctx = Factory.add_project_task(ctx, :project_task, nil, project_id: ctx.project.id)
    assert hd(Operately.Tasks.Task.available_statuses(ctx.project_task)).label == "Review"
  end

  setup ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.create_space_task(:task, :space)
    board = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Tasks"})
    Map.put(ctx, :board, board)
  end

  test "space tasks inherit the persisted default", ctx do
    assert ctx.task.board_id == ctx.space.default_task_board_id
    assert Repo.preload(ctx.task, :board).board.space_id == ctx.space.id
  end

  test "tasks and defaults can reference a board in their own space", ctx do
    task = ctx.task |> change(board_id: ctx.board.id) |> Repo.update!()
    space = ctx.space |> change(default_task_board_id: ctx.board.id) |> Repo.update!()

    assert Repo.preload(task, :board).board.id == ctx.board.id
    assert Repo.preload(space, :default_task_board).default_task_board.id == ctx.board.id
    assert ctx.board.id in Enum.map(Repo.preload(space, :task_boards).task_boards, & &1.id)
  end

  test "rejects a task reference to a missing board", ctx do
    assert_raise Ecto.ConstraintError, ~r/tasks_board_id_fkey/, fn ->
      ctx.task |> change(board_id: Ecto.UUID.generate()) |> Repo.update!()
    end
  end

  test "rejects a default reference to a missing board", ctx do
    assert_raise Ecto.ConstraintError, ~r/groups_default_task_board_id_fkey/, fn ->
      ctx.space |> change(default_task_board_id: Ecto.UUID.generate()) |> Repo.update!()
    end
  end

  test "project tasks reject boards belonging to spaces", ctx do
    ctx = ctx |> Factory.add_project(:project, :space) |> Factory.add_project_milestone(:milestone, :project) |> Factory.add_project_task(:project_task, :milestone)

    assert {:error, changeset} = ctx.project_task |> Operately.Tasks.Task.changeset(%{board_id: ctx.board.id}) |> Repo.update()
    assert "is invalid" in errors_on(changeset).board_id
  end

  test "cannot delete a board referenced by a task", ctx do
    ctx.task |> change(board_id: ctx.board.id) |> Repo.update!()
    assert_raise Ecto.ConstraintError, fn -> Repo.delete!(ctx.board) end
  end

  test "cannot delete a board referenced by a default", ctx do
    ctx.space |> change(default_task_board_id: ctx.board.id) |> Repo.update!()
    assert_raise Ecto.ConstraintError, fn -> Repo.delete!(ctx.board) end
  end

  test "permanently deleting a space cascades its boards and assigned tasks", ctx do
    ctx.task |> change(board_id: ctx.board.id) |> Repo.update!()
    space = ctx.space |> change(default_task_board_id: ctx.board.id) |> Repo.update!()

    Repo.delete!(space)

    refute Repo.get(TaskBoard, ctx.board.id)
    refute Repo.reload(ctx.task)
  end
end
