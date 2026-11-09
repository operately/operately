defmodule Operately.Tasks.TaskBoardTest do
  use Operately.DataCase

  alias Operately.Tasks.TaskBoard

  setup ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.create_space_task(:task, :space)
    board = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Tasks"})
    Map.put(ctx, :board, board)
  end

  test "legacy spaces and tasks keep nullable board references", ctx do
    assert ctx.task.board_id == nil
    assert ctx.space.default_task_board_id == nil
    assert Repo.preload(ctx.task, :board).board == nil
  end

  test "tasks and defaults can reference a board in their own space", ctx do
    task = ctx.task |> change(board_id: ctx.board.id) |> Repo.update!()
    space = ctx.space |> change(default_task_board_id: ctx.board.id) |> Repo.update!()

    assert Repo.preload(task, :board).board.id == ctx.board.id
    assert Repo.preload(space, :default_task_board).default_task_board.id == ctx.board.id
    assert Enum.map(Repo.preload(space, :task_boards).task_boards, & &1.id) == [ctx.board.id]
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

  test "project tasks cannot reference a space board", ctx do
    ctx = ctx |> Factory.add_project(:project, :space) |> Factory.add_project_milestone(:milestone, :project) |> Factory.add_project_task(:project_task, :milestone)

    assert_raise Ecto.ConstraintError, ~r/tasks_board_requires_space/, fn ->
      ctx.project_task |> change(board_id: ctx.board.id) |> Repo.update!()
    end
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
