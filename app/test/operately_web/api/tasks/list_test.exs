defmodule OperatelyWeb.Api.Tasks.ListTest do
  use OperatelyWeb.TurboCase
  alias Operately.Tasks.TaskBoard

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone)
    |> Factory.log_in_person(:creator)
  end

  test "lists a project board with or without an owner selector", ctx do
    board = Operately.Projects.Project.task_board(ctx.project)

    for inputs <- [%{board_id: board.id}, %{project_id: ctx.project.id}, %{project_id: ctx.project.id, board_id: board.id}] do
      assert {200, %{tasks: [task]}} = query(ctx.conn, [:tasks, :list], inputs)
      assert task.id == Paths.task_id(ctx.task)
      assert task.milestone.id == Paths.milestone_id(ctx.milestone)
    end
  end

  test "space listing includes every direct board but excludes project tasks", ctx do
    default = Repo.get!(TaskBoard, ctx.space.default_task_board_id)
    other = Repo.insert!(%TaskBoard{space_id: ctx.space.id, name: "Other", task_statuses: default.task_statuses})
    tasks = for board <- [default, other], do: Operately.TasksFixtures.task_fixture(%{space_id: ctx.space.id, board_id: board.id, creator_id: ctx.creator.id})
    assert {200, %{tasks: results}} = query(ctx.conn, [:tasks, :list], %{space_id: ctx.space.id})
    assert Enum.sort(Enum.map(results, & &1.id)) == Enum.sort(Enum.map(tasks, &Paths.task_id/1))
    assert {200, %{tasks: [result]}} = query(ctx.conn, [:tasks, :list], %{board_id: other.id})
    assert result.id == Paths.task_id(List.last(tasks))
  end

  test "rejects missing and conflicting selectors", ctx do
    for inputs <- [%{}, %{project_id: ctx.project.id, space_id: ctx.space.id}, %{project_id: ctx.project.id, board_id: ctx.space.default_task_board_id}] do
      assert {400, _} = query(ctx.conn, [:tasks, :list], inputs)
    end
  end

  test "board selectors do not expose private project tasks", ctx do
    ctx = ctx |> Factory.add_project(:private, :space, company_access_level: 0, space_access_level: 0) |> Factory.add_company_member(:reader) |> Factory.log_in_person(:reader)
    board = Operately.Projects.Project.task_board(ctx.private)
    assert {404, _} = query(ctx.conn, [:tasks, :list], %{board_id: board.id})
  end
end
