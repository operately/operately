defmodule Operately.Data.Change088PopulateTaskStatusFromDeprecatedStatusTest do
  use Operately.DataCase
  alias Operately.Repo
  alias Operately.Data.Change088PopulateTaskStatusFromDeprecatedStatus
  alias Operately.Data.Change088PopulateTaskStatusFromDeprecatedStatus.Task, as: DataTask
  alias Operately.Tasks.Task
  alias Operately.Support.Factory

  setup ctx do
    Factory.setup(ctx)
  end

  test "populates task_status for tasks without it", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)

    pending = insert_task(ctx.project.id, "pending")
    in_progress = insert_task(ctx.project.id, "in_progress")
    completed = insert_task(ctx.project.id, "completed")
    open = insert_task(ctx.project.id, "open")

    Change088PopulateTaskStatusFromDeprecatedStatus.run()

    assert_task_status(pending.id, "pending", %{label: "Pending", color: :gray, index: 2, closed: false})
    assert_task_status(in_progress.id, "in_progress", %{label: "In progress", color: :blue, index: 3, closed: false})
    assert_task_status(completed.id, "completed", %{label: "Completed", color: :green, index: 6, closed: true})
    assert_task_status(open.id, "open", %{label: "Open", color: :blue, index: 4, closed: false})
  end

  test "does not overwrite tasks that already have task_status", ctx do
    ctx = Factory.add_space(ctx, :space)
    ctx = Factory.add_project(ctx, :project, :space)

    with_status = insert_task(ctx.project.id, "todo", %{
      task_status: %{
        id: Ecto.UUID.generate(),
        label: "Custom",
        color: :gray,
        value: "custom",
        index: 0,
        closed: false
      }
    })

    without_status = insert_task(ctx.project.id, "todo")

    Change088PopulateTaskStatusFromDeprecatedStatus.run()

    reloaded = Repo.get!(Task, with_status.id)
    assert reloaded.task_status.value == "custom"

    reloaded_without = Repo.get!(Task, without_status.id)
    assert reloaded_without.task_status.value == "todo"
  end

  defp insert_task(project_id, status, overrides \\ %{}) do
    attrs =
      %{
        name: "Task #{Ecto.UUID.generate()}",
        description: %{},
        status: status,
        project_id: project_id,
        subscription_list_id: nil,
        task_status: Map.get(overrides, :task_status)
      }
      |> Map.merge(overrides)

    Repo.insert!(struct(DataTask, attrs))
  end

  defp assert_task_status(task_id, value, expected_attrs) do
    task = Repo.get!(Task, task_id)
    status = task.task_status

    assert status.value == value
    assert status.label == expected_attrs.label
    assert status.color == expected_attrs.color
    assert status.index == expected_attrs.index
    assert status.closed == expected_attrs.closed
    assert status.id
  end
end
