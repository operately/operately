defmodule Operately.Operations.ProjectTemplateMilestoneOrderingUpdatingTest do
  use Operately.DataCase

  alias Operately.Operations.ProjectTemplateMilestoneOrderingUpdating
  alias Operately.ProjectTemplates.{Milestone, ProjectTemplate, Task}
  alias Operately.Repo
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
    |> Factory.add_project_template_milestone(:milestone, :template)
  end

  describe "same milestone" do
    test "moves a task to the requested index without rewriting kanban", ctx do
      ctx =
        ctx
        |> Factory.add_project_template_task(:first, :template, milestone: :milestone)
        |> Factory.add_project_template_task(:second, :template, milestone: :milestone)
        |> Factory.add_project_template_task(:third, :template, milestone: :milestone)

      kanban = kanban(ctx, [:first, :second, :third])
      set_list(ctx.milestone, ids(ctx, [:first, :second, :third]), kanban)

      assert {:ok, changes} = run(ctx, ctx.first, ctx.milestone.id, 2)
      assert changes.updated_task.project_template_milestone_id == ctx.milestone.id

      milestone = Repo.reload!(ctx.milestone)
      assert milestone.tasks_ordering_state == ids(ctx, [:second, :third, :first])
      assert milestone.tasks_kanban_state == kanban
    end

    test "clamps an index past the end of the list", ctx do
      ctx =
        ctx
        |> Factory.add_project_template_task(:first, :template, milestone: :milestone)
        |> Factory.add_project_template_task(:second, :template, milestone: :milestone)

      set_list(ctx.milestone, ids(ctx, [:first, :second]))

      assert {:ok, _} = run(ctx, ctx.first, ctx.milestone.id, 100)
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == ids(ctx, [:second, :first])
    end

    test "inserts a member that was missing from the stored list", ctx do
      ctx =
        ctx
        |> Factory.add_project_template_task(:first, :template, milestone: :milestone)
        |> Factory.add_project_template_task(:second, :template, milestone: :milestone)

      set_list(ctx.milestone, ids(ctx, [:second]))

      assert {:ok, _} = run(ctx, ctx.first, ctx.milestone.id, 0)
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == ids(ctx, [:first, :second])
    end

    test "drops stale and duplicate ids from the stored list", ctx do
      ctx =
        ctx
        |> Factory.add_project_template_task(:first, :template, milestone: :milestone)
        |> Factory.add_project_template_task(:second, :template, milestone: :milestone)

      first_id = id(ctx.first)
      second_id = id(ctx.second)
      set_list(ctx.milestone, ["ghost", first_id, first_id, second_id])

      assert {:ok, _} = run(ctx, ctx.first, ctx.milestone.id, 1)
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == [second_id, first_id]
    end
  end

  describe "changing container" do
    test "moves a task between milestones at the requested index without rewriting kanban", ctx do
      ctx =
        ctx
        |> Factory.add_project_template_milestone(:destination, :template)
        |> Factory.add_project_template_task(:moving, :template, milestone: :milestone)
        |> Factory.add_project_template_task(:kept, :template, milestone: :milestone)
        |> Factory.add_project_template_task(:already_there, :template, milestone: :destination)

      source_kanban = kanban(ctx, [:moving, :kept])
      dest_kanban = kanban(ctx, [:already_there])
      set_list(ctx.milestone, ids(ctx, [:moving, :kept]), source_kanban)
      set_list(ctx.destination, ids(ctx, [:already_there]), dest_kanban)

      assert {:ok, changes} = run(ctx, ctx.moving, ctx.destination.id, 0)
      assert changes.updated_task.project_template_milestone_id == ctx.destination.id

      source = Repo.reload!(ctx.milestone)
      destination = Repo.reload!(ctx.destination)
      assert source.tasks_ordering_state == ids(ctx, [:kept])
      assert destination.tasks_ordering_state == ids(ctx, [:moving, :already_there])
      assert source.tasks_kanban_state == source_kanban
      assert destination.tasks_kanban_state == dest_kanban
    end

    test "moves a task to the root without using the index or rewriting kanban", ctx do
      ctx =
        ctx
        |> Factory.add_project_template_task(:root, :template)
        |> Factory.add_project_template_task(:moving, :template, milestone: :milestone)
        |> Factory.add_project_template_task(:kept, :template, milestone: :milestone)

      template_kanban = kanban(ctx, [:root])
      milestone_kanban = kanban(ctx, [:moving, :kept])
      set_template_kanban(ctx.template, template_kanban)
      set_list(ctx.milestone, ids(ctx, [:moving, :kept]), milestone_kanban)

      assert {:ok, changes} = run(ctx, ctx.moving, nil, 99)
      assert changes.updated_task.project_template_milestone_id == nil

      template = Repo.reload!(ctx.template)
      milestone = Repo.reload!(ctx.milestone)
      assert template.tasks_kanban_state == template_kanban
      assert milestone.tasks_kanban_state == milestone_kanban
      assert milestone.tasks_ordering_state == ids(ctx, [:kept])
    end

    test "moves a root task onto a milestone at the requested index without rewriting kanban", ctx do
      ctx =
        ctx
        |> Factory.add_project_template_task(:moving, :template)
        |> Factory.add_project_template_task(:already_there, :template, milestone: :milestone)

      template_kanban = kanban(ctx, [:moving])
      milestone_kanban = kanban(ctx, [:already_there])
      set_template_kanban(ctx.template, template_kanban)
      set_list(ctx.milestone, ids(ctx, [:already_there]), milestone_kanban)

      assert {:ok, changes} = run(ctx, ctx.moving, ctx.milestone.id, 0)
      assert changes.updated_task.project_template_milestone_id == ctx.milestone.id

      template = Repo.reload!(ctx.template)
      milestone = Repo.reload!(ctx.milestone)
      assert template.tasks_kanban_state == template_kanban
      assert milestone.tasks_kanban_state == milestone_kanban
      assert milestone.tasks_ordering_state == ids(ctx, [:moving, :already_there])
    end
  end

  describe "validation" do
    test "rejects a negative index without changing the task or lists", ctx do
      ctx =
        ctx
        |> Factory.add_project_template_milestone(:destination, :template)
        |> Factory.add_project_template_task(:moving, :template, milestone: :milestone)

      set_list(ctx.milestone, ids(ctx, [:moving]))

      assert {:error, :validate_index, {:validation, "Task index must be zero or greater"}, _} =
               run(ctx, ctx.moving, ctx.destination.id, -1)

      assert Repo.reload!(ctx.moving).project_template_milestone_id == ctx.milestone.id
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == ids(ctx, [:moving])
      assert Repo.reload!(ctx.destination).tasks_ordering_state == []
    end

    test "rejects a milestone from another template without changing the task", ctx do
      ctx =
        ctx
        |> Factory.add_project_template_task(:task, :template, milestone: :milestone)
        |> Factory.add_project_template(:other_template, :space)
        |> Factory.add_project_template_milestone(:foreign, :other_template)

      set_list(ctx.milestone, ids(ctx, [:task]))

      assert {:error, :validated_milestone, {:not_found, :milestone}, _} =
               run(ctx, ctx.task, ctx.foreign.id, 0)

      assert Repo.reload!(ctx.task).project_template_milestone_id == ctx.milestone.id
      assert Repo.reload!(ctx.milestone).tasks_ordering_state == ids(ctx, [:task])
    end
  end

  defp run(ctx, task, milestone_id, index) do
    ctx.template
    |> ProjectTemplateMilestoneOrderingUpdating.run(task, milestone_id, index)
    |> Repo.transaction()
  end

  defp set_list(milestone, task_ids, kanban \\ %{}) do
    milestone
    |> Milestone.changeset(%{tasks_ordering_state: task_ids, tasks_kanban_state: kanban})
    |> Repo.update!()
  end

  defp set_template_kanban(template, kanban) do
    template
    |> ProjectTemplate.changeset(%{tasks_kanban_state: kanban})
    |> Repo.update!()
  end

  defp kanban(ctx, names), do: %{"pending" => ids(ctx, names)}
  defp ids(ctx, names), do: Enum.map(names, &id(Map.fetch!(ctx, &1)))
  defp id(%Task{} = task), do: Paths.project_template_task_id(task)
end
