defmodule Operately.Data.Change087PopulateDefaultTaskStatusesTest do
  use Operately.DataCase
  import Ecto.Query

  alias Operately.{Repo, Projects}
  alias Operately.Projects.Project
  alias Operately.Data.Change087PopulateDefaultTaskStatuses
  alias Operately.Support.Factory

  setup ctx do
    Factory.setup(ctx)
  end

  test "populates task_statuses for projects with empty list", ctx do
    # Create a project using factory (will have defaults)
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)

    # Manually set task_statuses to empty array
    from(p in Project, where: p.id == ^ctx.project.id)
    |> Repo.update_all(set: [task_statuses: []])

    project = Repo.get!(Project, ctx.project.id)
    assert project.task_statuses == []

    Change087PopulateDefaultTaskStatuses.run()

    updated_project = Repo.get!(Project, ctx.project.id)
    assert length(updated_project.task_statuses) == 4
    assert_default_task_statuses(updated_project.task_statuses)
  end

  test "does not modify projects that already have task_statuses", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)

    # Manually set to a custom status to verify migration doesn't overwrite
    Projects.update_project(ctx.project, %{task_statuses: [
      %{id: Ecto.UUID.generate(), label: "My Custom Status", color: "blue", value: "custom_pending", index: 0, closed: false}
    ]})

    # Verify custom status is set
    project = Repo.get!(Project, ctx.project.id)
    assert length(project.task_statuses) == 1
    assert hd(project.task_statuses).label == "My Custom Status"

    Change087PopulateDefaultTaskStatuses.run()

    # Should remain unchanged with custom status
    updated_project = Repo.get!(Project, ctx.project.id)
    assert length(updated_project.task_statuses) == 1
    assert hd(updated_project.task_statuses).label == "My Custom Status"
    assert hd(updated_project.task_statuses).value == "custom_pending"
  end

  test "handles multiple projects with mixed states", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project_empty, :space)
    ctx = Factory.add_project(ctx, :project_custom, :space)
    ctx = Factory.add_project(ctx, :project_partial, :space)

    # Set first project to empty array
    Projects.update_project(ctx.project_empty, %{task_statuses: []})

    # Set second project to custom statuses
    Projects.update_project(ctx.project_custom, %{task_statuses: [
      %{id: Ecto.UUID.generate(), label: "Backlog", color: "gray", value: "backlog", index: 0, closed: false},
      %{id: Ecto.UUID.generate(), label: "Completed", color: "green", value: "completed", index: 1, closed: true}
    ]})

    # Set third project to partial statuses (only 1 instead of 4)
    Projects.update_project(ctx.project_partial, %{task_statuses: [
      %{id: Ecto.UUID.generate(), label: "Todo", color: "gray", value: "todo", index: 0, closed: false}
    ]})

    Change087PopulateDefaultTaskStatuses.run()

    # Project with empty should now have 4 defaults
    updated_empty = Repo.get!(Project, ctx.project_empty.id)
    assert length(updated_empty.task_statuses) == 4
    assert_default_task_statuses(updated_empty.task_statuses)

    # Project with custom statuses should remain unchanged (2 custom statuses)
    updated_custom = Repo.get!(Project, ctx.project_custom.id)
    assert length(updated_custom.task_statuses) == 2
    assert hd(updated_custom.task_statuses).label == "Backlog"

    # Project with partial statuses should remain unchanged (1 status)
    updated_partial = Repo.get!(Project, ctx.project_partial.id)
    assert length(updated_partial.task_statuses) == 1
    assert hd(updated_partial.task_statuses).label == "Todo"
  end

  defp assert_default_task_statuses(task_statuses) do
    # Check that we have the expected default statuses
    statuses_by_value = Enum.group_by(task_statuses, & &1.value)

    assert Map.has_key?(statuses_by_value, "pending")
    assert Map.has_key?(statuses_by_value, "in_progress")
    assert Map.has_key?(statuses_by_value, "done")
    assert Map.has_key?(statuses_by_value, "canceled")

    # Check specific properties of each status
    pending = hd(statuses_by_value["pending"])
    assert pending.label == "Not started"
    assert pending.color == :gray
    assert pending.index == 0
    assert pending.closed == false

    in_progress = hd(statuses_by_value["in_progress"])
    assert in_progress.label == "In progress"
    assert in_progress.color == :blue
    assert in_progress.index == 1
    assert in_progress.closed == false

    done = hd(statuses_by_value["done"])
    assert done.label == "Done"
    assert done.color == :green
    assert done.index == 2
    assert done.closed == true

    canceled = hd(statuses_by_value["canceled"])
    assert canceled.label == "Canceled"
    assert canceled.color == :red
    assert canceled.index == 3
    assert canceled.closed == true
  end
end
