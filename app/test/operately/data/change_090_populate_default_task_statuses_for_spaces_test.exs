defmodule Operately.Data.Change090PopulateDefaultTaskStatusesForSpacesTest do
  use Operately.DataCase
  import Ecto.Query

  alias Operately.{Repo}
  alias Operately.Groups.Group
  alias Operately.Data.Change090PopulateDefaultTaskStatusesForSpaces
  alias Operately.Support.Factory

  setup ctx do
    Factory.setup(ctx)
  end

  test "populates task_statuses for spaces with empty list", ctx do
    ctx = Factory.add_space(ctx, :space)

    from(g in Group, where: g.id == ^ctx.space.id)
    |> Repo.update_all(set: [task_statuses: []])

    space = Repo.get!(Group, ctx.space.id)
    assert space.task_statuses == []

    Change090PopulateDefaultTaskStatusesForSpaces.run()

    updated_space = Repo.get!(Group, ctx.space.id)
    assert length(updated_space.task_statuses) == 4
    assert_default_task_statuses(updated_space.task_statuses)
  end

  test "does not modify spaces that already have task_statuses", ctx do
    ctx = Factory.add_space(ctx, :space)

    {:ok, _space} =
      ctx.space
      |> Ecto.Changeset.change(%{
        task_statuses: [
          %{id: Ecto.UUID.generate(), label: "My Custom Status", color: "blue", value: "custom_pending", index: 0, closed: false}
        ]
      })
      |> Repo.update()

    space = Repo.get!(Group, ctx.space.id)
    assert length(space.task_statuses) == 1
    assert hd(space.task_statuses).label == "My Custom Status"

    Change090PopulateDefaultTaskStatusesForSpaces.run()

    updated_space = Repo.get!(Group, ctx.space.id)
    assert length(updated_space.task_statuses) == 1
    assert hd(updated_space.task_statuses).label == "My Custom Status"
    assert hd(updated_space.task_statuses).value == "custom_pending"
  end

  test "handles multiple spaces with mixed states", ctx do
    # Create three spaces explicitly using the available factory helper
    ctx = Factory.add_space(ctx, :space_empty)
    ctx = Factory.add_space(ctx, :space_custom)
    ctx = Factory.add_space(ctx, :space_partial)

    {:ok, _} =
      ctx.space_empty
      |> Ecto.Changeset.change(%{task_statuses: []})
      |> Repo.update()

    {:ok, _} =
      ctx.space_custom
      |> Ecto.Changeset.change(%{
        task_statuses: [
          %{id: Ecto.UUID.generate(), label: "Backlog", color: "gray", value: "backlog", index: 0, closed: false},
          %{id: Ecto.UUID.generate(), label: "Completed", color: "green", value: "completed", index: 1, closed: true}
        ]
      })
      |> Repo.update()

    {:ok, _} =
      ctx.space_partial
      |> Ecto.Changeset.change(%{
        task_statuses: [
          %{id: Ecto.UUID.generate(), label: "Todo", color: "gray", value: "todo", index: 0, closed: false}
        ]
      })
      |> Repo.update()

    Change090PopulateDefaultTaskStatusesForSpaces.run()

    updated_empty = Repo.get!(Group, ctx.space_empty.id)
    assert length(updated_empty.task_statuses) == 4
    assert_default_task_statuses(updated_empty.task_statuses)

    updated_custom = Repo.get!(Group, ctx.space_custom.id)
    assert length(updated_custom.task_statuses) == 2
    assert hd(updated_custom.task_statuses).label == "Backlog"

    updated_partial = Repo.get!(Group, ctx.space_partial.id)
    assert length(updated_partial.task_statuses) == 1
    assert hd(updated_partial.task_statuses).label == "Todo"
  end

  defp assert_default_task_statuses(task_statuses) do
    statuses_by_value = Enum.group_by(task_statuses, & &1.value)

    assert Map.has_key?(statuses_by_value, "pending")
    assert Map.has_key?(statuses_by_value, "in_progress")
    assert Map.has_key?(statuses_by_value, "done")
    assert Map.has_key?(statuses_by_value, "canceled")

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
