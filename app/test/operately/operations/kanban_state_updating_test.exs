defmodule Operately.Operations.KanbanStateUpdatingTest do
  use Operately.DataCase

  alias Operately.Operations.KanbanStateUpdating
  alias Operately.Repo
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:project_task, :milestone)
    |> Factory.create_space_task(:space_task, :space)
  end

  test "project Kanban uses the canonical task status metadata", ctx do
    scope = %{type: :project, project: ctx.project}

    assert_canonical_status_transitions(ctx.creator, scope, ctx.project_task, ctx.project.task_statuses)
  end

  test "milestone Kanban uses the canonical task status metadata", ctx do
    scope = %{type: :milestone, project: ctx.project, milestone: ctx.milestone}

    assert_canonical_status_transitions(ctx.creator, scope, ctx.project_task, ctx.project.task_statuses)
  end

  test "space Kanban uses the canonical task status metadata", ctx do
    scope = %{type: :space, space: ctx.space}

    assert_canonical_status_transitions(ctx.creator, scope, ctx.space_task, ctx.space.task_statuses)
  end

  defp assert_canonical_status_transitions(author, scope, task, statuses) do
    closed_status = Enum.find(statuses, & &1.closed)
    open_status = Enum.find(statuses, &(!&1.closed))

    assert {:ok, _} = run(author, scope, task, Map.from_struct(closed_status))

    closed_task = Repo.reload!(task)
    assert closed_task.task_status.id == closed_status.id
    assert closed_task.status == closed_status.value
    assert closed_task.closed_at
    refute closed_task.reopened_at

    assert {:ok, _} = run(author, scope, closed_task, Map.from_struct(open_status))

    reopened_task = Repo.reload!(task)
    assert reopened_task.task_status.id == open_status.id
    assert reopened_task.status == open_status.value
    refute reopened_task.closed_at
    assert reopened_task.reopened_at
  end

  defp run(author, scope, task, status) do
    author
    |> KanbanStateUpdating.run(scope, task, status, %{})
    |> Repo.transaction()
  end
end
