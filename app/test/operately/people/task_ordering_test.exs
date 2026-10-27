defmodule Operately.People.TaskOrderingTest do
  use Operately.DataCase

  alias Operately.People.TaskOrdering
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.create_space_task(:task, :space)
    |> Factory.add_task_assignee(:assignment, :task, :creator)
  end

  test "saving from a stale person preserves newer preferences", ctx do
    {:ok, _} = Operately.People.update_person(ctx.creator, %{preferences: %{time_format: :hour_24}})
    assert {:ok, [id]} = TaskOrdering.update(ctx.creator, [ctx.task.id])
    assert id == ctx.task.id
    assert Operately.People.Person.time_format(Repo.reload!(ctx.creator)) == :hour_24
  end

  test "a release dismissal from a stale person preserves the saved task order", ctx do
    assert {:ok, _} = TaskOrdering.update(ctx.creator, [ctx.task.id])

    assert {:ok, person} = Operately.People.update_person(ctx.creator, %{preferences: %{dismissed_product_release_id: "v1.8"}})

    assert person.preferences.task_ordering == [ctx.task.id]
    assert person.preferences.dismissed_product_release_id == "v1.8"
    assert Repo.reload!(ctx.creator).preferences == person.preferences
  end

  test "closed and unassigned tasks disappear from the saved order", ctx do
    assert {:ok, _} = TaskOrdering.update(ctx.creator, [ctx.task.id])
    person = Repo.reload!(ctx.creator)
    {:ok, _} = Operately.Tasks.update_task(ctx.task, %{task_status: %{id: Ecto.UUID.generate(), label: "Done", color: :green, index: 0, value: "done", closed: true}})
    assert TaskOrdering.get(person) == []
    Repo.delete!(ctx.assignment)
    assert TaskOrdering.get(person) == []
  end

  test "tasks from another company cannot be included even with an assignment", ctx do
    other = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.create_space_task(:task, :space)
    ctx = ctx |> Map.put(:foreign_task, other.task) |> Factory.add_task_assignee(:foreign_assignment, :foreign_task, :creator)
    assert {:error, :bad_request} = TaskOrdering.update(ctx.creator, [ctx.foreign_task.id])
  end
end
