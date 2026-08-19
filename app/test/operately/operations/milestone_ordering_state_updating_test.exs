defmodule Operately.Operations.MilestoneOrderingStateUpdatingTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Activities.Activity
  alias Operately.Operations.MilestoneOrderingStateUpdating
  alias Operately.Projects.Milestone
  alias Operately.Repo
  alias Operately.Support.Factory
  alias Operately.Tasks.Task
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
  end

  describe "same milestone" do
    test "moves a task to the requested index without rewriting kanban", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:first, :milestone)
        |> Factory.add_project_task(:second, :milestone)
        |> Factory.add_project_task(:third, :milestone)

      kanban = snapshot_kanban(ctx.milestone)
      set_list(ctx.milestone, ids(ctx, [:first, :second, :third]))

      assert {:ok, changes} = run(ctx, ctx.first, ctx.milestone.id, 2)
      assert changes.updated_task.milestone_id == ctx.milestone.id
      assert Enum.map(changes.updated_milestones, & &1.id) == [ctx.milestone.id]

      milestone = Repo.reload!(ctx.milestone)
      assert milestone.tasks_ordering_state == ids(ctx, [:second, :third, :first])
      assert milestone.tasks_kanban_state == kanban
    end

    test "clamps an index past the end of the list", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:first, :milestone)
        |> Factory.add_project_task(:second, :milestone)

      set_list(ctx.milestone, ids(ctx, [:first, :second]))

      assert {:ok, _} = run(ctx, ctx.first, ctx.milestone.id, 100)
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == ids(ctx, [:second, :first])
    end

    test "inserts a visible member that was missing from the stored list", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:first, :milestone)
        |> Factory.add_project_task(:second, :milestone)

      set_list(ctx.milestone, ids(ctx, [:second]))

      assert {:ok, _} = run(ctx, ctx.first, ctx.milestone.id, 0)
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == ids(ctx, [:first, :second])
    end

    test "drops stale, duplicate, and closed ids from the stored list", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:first, :milestone)
        |> Factory.add_project_task(:second, :milestone)
        |> Factory.add_project_task(:done, :milestone, status: "done")
        |> Factory.add_project_task(:canceled, :milestone, status: "canceled")

      first_id = id(ctx.first)
      second_id = id(ctx.second)
      set_list(ctx.milestone, ["ghost", first_id, first_id, second_id, id(ctx.done), id(ctx.canceled)])

      assert {:ok, _} = run(ctx, ctx.first, ctx.milestone.id, 1)
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == [second_id, first_id]
    end

    test "does not create an activity when only the list order changes", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:first, :milestone)
        |> Factory.add_project_task(:second, :milestone)

      set_list(ctx.milestone, ids(ctx, [:first, :second]))

      assert {:ok, _} = run(ctx, ctx.first, ctx.milestone.id, 1)
      assert activity_count(ctx.project.id) == 0
    end
  end

  describe "changing container" do
    test "moves a task between milestones at the requested index without rewriting kanban", ctx do
      ctx =
        ctx
        |> Factory.add_project_milestone(:destination, :project)
        |> Factory.add_project_task(:moving, :milestone)
        |> Factory.add_project_task(:kept, :milestone)
        |> Factory.add_project_task(:already_there, :destination)

      source_kanban = snapshot_kanban(ctx.milestone)
      dest_kanban = snapshot_kanban(ctx.destination)
      set_list(ctx.milestone, ids(ctx, [:moving, :kept]))
      set_list(ctx.destination, ids(ctx, [:already_there]))

      assert {:ok, changes} = run(ctx, ctx.moving, ctx.destination.id, 0)
      assert changes.updated_task.milestone_id == ctx.destination.id
      assert Enum.map(changes.updated_milestones, & &1.id) == [ctx.milestone.id, ctx.destination.id]

      source = Repo.reload!(ctx.milestone)
      destination = Repo.reload!(ctx.destination)
      assert source.tasks_ordering_state == ids(ctx, [:kept])
      assert destination.tasks_ordering_state == ids(ctx, [:moving, :already_there])
      assert source.tasks_kanban_state == source_kanban
      assert destination.tasks_kanban_state == dest_kanban
    end

    test "moves a task to the root without using the index", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:moving, :milestone)
        |> Factory.add_project_task(:kept, :milestone)

      kanban = snapshot_kanban(ctx.milestone)
      set_list(ctx.milestone, ids(ctx, [:moving, :kept]))

      assert {:ok, changes} = run(ctx, ctx.moving, nil, 99)
      assert changes.updated_task.milestone_id == nil
      assert Enum.map(changes.updated_milestones, & &1.id) == [ctx.milestone.id]

      milestone = Repo.reload!(ctx.milestone)
      assert milestone.tasks_ordering_state == ids(ctx, [:kept])
      assert milestone.tasks_kanban_state == kanban
    end

    test "moves a root task onto a milestone at the requested index", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:already_there, :milestone)
        |> Factory.add_project_task(:moving, nil, project_id: ctx.project.id)

      kanban = snapshot_kanban(ctx.milestone)
      set_list(ctx.milestone, ids(ctx, [:already_there]))

      assert {:ok, changes} = run(ctx, ctx.moving, ctx.milestone.id, 0)
      assert changes.updated_task.milestone_id == ctx.milestone.id

      milestone = Repo.reload!(ctx.milestone)
      assert milestone.tasks_ordering_state == ids(ctx, [:moving, :already_there])
      assert milestone.tasks_kanban_state == kanban
    end

    test "updates the closed task's milestone without inserting it into list order", ctx do
      ctx =
        ctx
        |> Factory.add_project_milestone(:destination, :project)
        |> Factory.add_project_task(:moving, :milestone, status: "done")
        |> Factory.add_project_task(:already_there, :destination)

      set_list(ctx.milestone, ids(ctx, [:moving]))
      set_list(ctx.destination, ids(ctx, [:already_there]))

      assert {:ok, changes} = run(ctx, ctx.moving, ctx.destination.id, 0)
      assert changes.updated_task.milestone_id == ctx.destination.id
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == []
      assert Repo.reload!(ctx.destination).tasks_ordering_state == ids(ctx, [:already_there])
    end

    test "creates an activity when the milestone changes", ctx do
      ctx =
        ctx
        |> Factory.add_project_milestone(:destination, :project)
        |> Factory.add_project_task(:moving, :milestone)

      assert {:ok, _} = run(ctx, ctx.moving, ctx.destination.id, 0)
      assert activity_count(ctx.project.id) == 1
    end
  end

  describe "validation" do
    test "rejects a negative index without changing the task or lists", ctx do
      ctx =
        ctx
        |> Factory.add_project_milestone(:destination, :project)
        |> Factory.add_project_task(:moving, :milestone)

      set_list(ctx.milestone, ids(ctx, [:moving]))

      assert {:error, :validate_index, {:validation, "Task index must be zero or greater"}, _} =
               run(ctx, ctx.moving, ctx.destination.id, -1)

      assert Repo.reload!(ctx.moving).milestone_id == ctx.milestone.id
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == ids(ctx, [:moving])
      assert Repo.reload!(ctx.destination).tasks_ordering_state == []
    end

    test "rejects a milestone from another project without changing the task", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone)
        |> Factory.add_project(:other_project, :space)
        |> Factory.add_project_milestone(:foreign, :other_project)

      set_list(ctx.milestone, ids(ctx, [:task]))

      assert {:error, :validated_milestone, {:bad_request, "Milestone must belong to the same project as the task"}, _} =
               run(ctx, ctx.task, ctx.foreign.id, 0)

      assert Repo.reload!(ctx.task).milestone_id == ctx.milestone.id
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == ids(ctx, [:task])
    end

    test "rejects a missing milestone without changing the task", ctx do
      ctx = Factory.add_project_task(ctx, :task, :milestone)
      set_list(ctx.milestone, ids(ctx, [:task]))

      assert {:error, :validated_milestone, {:not_found, "Milestone not found"}, _} =
               run(ctx, ctx.task, Ecto.UUID.generate(), 0)

      assert Repo.reload!(ctx.task).milestone_id == ctx.milestone.id
    end

    test "rejects a task that does not belong to the project", ctx do
      ctx =
        ctx
        |> Factory.add_project(:other_project, :space)
        |> Factory.add_project_milestone(:other_milestone, :other_project)
        |> Factory.add_project_task(:foreign_task, :other_milestone)

      assert {:error, :validate_task_parent, :not_found, _} =
               run(ctx, ctx.foreign_task, ctx.milestone.id, 0)
    end
  end

  defp run(ctx, task, milestone_id, index) do
    ctx.creator
    |> MilestoneOrderingStateUpdating.run(ctx.project, task, milestone_id, index)
    |> Repo.transaction()
  end

  defp set_list(milestone, task_ids) do
    milestone
    |> Milestone.changeset(%{tasks_ordering_state: task_ids})
    |> Repo.update!()
  end

  defp snapshot_kanban(milestone), do: Repo.reload!(milestone).tasks_kanban_state

  defp activity_count(project_id) do
    from(a in Activity, where: a.action == "task_milestone_updating" and a.content["project_id"] == ^project_id)
    |> Repo.aggregate(:count)
  end

  defp ids(ctx, names), do: Enum.map(names, &id(Map.fetch!(ctx, &1)))
  defp id(%Task{} = task), do: Paths.task_id(task)
end
