defmodule OperatelyWeb.Api.ProjectTemplates.SharedStepsTest do
  use Operately.DataCase

  alias Operately.ProjectTemplates.{Milestone, ProjectTemplate, Task}
  alias Operately.Tasks.Status
  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
  end

  test "creates only a blank template with the default workflow", ctx do
    before_counts = runtime_counts()

    assert {:ok, template} =
             create_template(ctx.creator, %{
               space_id: ctx.space.id,
               name: "Launch template",
               description: %{"type" => "doc"},
               duration_days: 14
             })

    assert template.company_id == ctx.company.id
    assert template.space_id == ctx.space.id
    assert template.creator_id == ctx.creator.id
    assert template.name == "Launch template"
    assert template.description == %{"type" => "doc"}
    assert template.duration_days == 14
    assert length(template.task_statuses) == 4
    assert template.milestones_ordering_state == []
    assert Repo.aggregate(ProjectTemplate, :count) == 2
    assert runtime_counts() == before_counts
  end

  test "does not create an invalid template", ctx do
    before_count = Repo.aggregate(ProjectTemplate, :count)

    assert {:error, changeset} = create_template(ctx.creator, %{space_id: ctx.space.id, name: "", duration_days: -1})
    assert %{name: ["can't be blank"], duration_days: [_]} = errors_on(changeset)
    assert Repo.aggregate(ProjectTemplate, :count) == before_count
  end

  test "updates reusable template fields and rejects an empty workflow", ctx do
    statuses = Status.default_task_statuses()

    assert {:ok, template} =
             update_template(ctx.template, %{
               name: "Updated",
               description: %{"type" => "doc"},
               duration_days: 0,
               task_statuses: Enum.map(statuses, &Map.from_struct/1)
             })

    assert template.name == "Updated"
    assert template.duration_days == 0
    assert Enum.map(template.task_statuses, & &1.id) == Enum.map(statuses, & &1.id)

    assert {:error, {:validation, "At least one task status is required"}} =
             update_template(template, %{task_statuses: []})

    [first, second | rest] = Enum.map(statuses, &Map.from_struct/1)

    assert {:error, {:validation, "Task status values must be unique"}} =
             update_template(template, %{task_statuses: [%{first | value: second.value}, second | rest]})
  end

  test "creates, updates, moves, and deletes milestones and tasks while keeping ordering synchronized", ctx do
    status = hd(ctx.template.task_statuses)

    assert {:ok, milestone} = create_milestone(ctx.template, %{title: "Ship", due_offset_days: 0})
    template = Repo.reload!(ctx.template)
    assert template.milestones_ordering_state == [Paths.project_template_milestone_id(milestone)]

    assert {:ok, root_task} = create_task(template, %{name: "Root", description: %{}, task_status: Map.from_struct(status)})

    assert {:ok, moved_task} = update_task(template, root_task, %{project_template_milestone_id: milestone.id, due_offset_days: 7})
    milestone = Repo.reload!(milestone)
    assert moved_task.project_template_milestone_id == milestone.id
    assert milestone.tasks_ordering_state == [Paths.project_template_task_id(moved_task)]

    assert {:ok, updated_milestone} = update_milestone(template, milestone, %{title: "Launch", due_offset_days: 14})
    assert updated_milestone.title == "Launch"
    assert updated_milestone.due_offset_days == 14

    assert {:ok, _task} = delete_task(template, moved_task)
    milestone = Repo.reload!(milestone)
    assert milestone.tasks_ordering_state == []

    assert {:ok, child} = create_task(template, %{name: "Child", description: %{}, project_template_milestone_id: milestone.id})
    assert {:ok, _milestone} = delete_milestone(template, milestone)
    refute Repo.get(Milestone, milestone.id)
    refute Repo.get(Task, child.id)
    assert Repo.reload!(template).milestones_ordering_state == []
  end

  test "rejects negative offsets and milestones from another template", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:other_template, :space)
      |> Factory.add_project_template_milestone(:other_milestone, :other_template)

    assert {:error, changeset} = create_milestone(ctx.template, %{title: "Invalid", due_offset_days: -1})
    assert %{due_offset_days: [_]} = errors_on(changeset)

    assert {:error, {:not_found, :milestone}} =
             create_task(ctx.template, %{
               name: "Invalid",
               description: %{},
               project_template_milestone_id: ctx.other_milestone.id
             })
  end

  test "replaces deleted statuses across tasks", ctx do
    [old_status, replacement | _] = ctx.template.task_statuses

    assert {:ok, task} = create_task(ctx.template, %{name: "Task", description: %{}, task_status: Map.from_struct(old_status)})

    statuses = Enum.reject(ctx.template.task_statuses, &(&1.id == old_status.id))

    assert {:ok, _template} =
             update_template(Repo.reload!(ctx.template), %{
               task_statuses: Enum.map(statuses, &Map.from_struct/1),
               deleted_status_replacements: [%{deleted_status_id: old_status.id, replacement_status_id: replacement.id}]
             })

    task = Repo.reload!(task)
    assert task.task_status.id == replacement.id
  end

  test "rolls back the workflow update when a deleted status has no replacement", ctx do
    [deleted_status | remaining_statuses] = ctx.template.task_statuses

    assert {:ok, task} =
             create_task(ctx.template, %{
               name: "Task",
               description: %{},
               task_status: Map.from_struct(deleted_status)
             })

    assert {:error, {:validation, "Every deleted task status in use requires a replacement"}} =
             update_template(Repo.reload!(ctx.template), %{
               task_statuses: Enum.map(remaining_statuses, &Map.from_struct/1)
             })

    assert Enum.map(Repo.reload!(ctx.template).task_statuses, & &1.id) == Enum.map(ctx.template.task_statuses, & &1.id)
    assert Repo.reload!(task).task_status.id == deleted_status.id
  end

  test "rejects foreign ordering state", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:other_template, :space)
      |> Factory.add_project_template_milestone(:other_milestone, :other_template)

    assert {:error, {:validation, "Milestone ordering contains IDs from another template"}} =
             update_template(ctx.template, %{
               milestones_ordering_state: [Paths.project_template_milestone_id(ctx.other_milestone)]
             })
  end

  test "does not write to runtime tables while editing", ctx do
    before_counts = runtime_counts()

    assert {:ok, milestone} = create_milestone(ctx.template, %{title: "Milestone"})
    assert {:ok, task} = create_task(Repo.reload!(ctx.template), %{name: "Task", description: %{}, project_template_milestone_id: milestone.id})
    assert {:ok, _task} = update_task(Repo.reload!(ctx.template), task, %{name: "Updated"})

    assert runtime_counts() == before_counts
  end

  defp runtime_counts do
    [
      Operately.Projects.Project,
      Operately.Access.Context,
      Operately.ResourceHubs.ResourceHub,
      Operately.Activities.Activity,
      Operately.Notifications.Notification,
      Operately.Notifications.SubscriptionList,
      Operately.Projects.CheckIn,
      Operately.Search.Entry
    ]
    |> Map.new(&{&1, Repo.aggregate(&1, :count)})
  end

  defp update_template(template, attrs), do: run_step(template, &Steps.update_template(&1, attrs), :updated_template)

  defp create_template(creator, attrs) do
    result =
      Ecto.Multi.new()
      |> Ecto.Multi.put(:me, creator)
      |> Steps.create_template(attrs)
      |> Steps.commit()

    case result do
      {:ok, %{template: template}} -> {:ok, template}
      {:error, :template, changeset, _changes} -> {:error, changeset}
    end
  end

  defp create_milestone(template, attrs), do: run_step(template, &Steps.create_milestone(&1, attrs), :milestone)

  defp update_milestone(template, milestone, attrs) do
    run_step(template, &(&1 |> Ecto.Multi.put(:milestone, milestone) |> Steps.update_milestone(attrs)), :updated_milestone)
  end

  defp delete_milestone(template, milestone) do
    run_step(template, &(&1 |> Ecto.Multi.put(:milestone, milestone) |> Steps.delete_milestone()), :deleted_milestone)
  end

  defp create_task(template, attrs), do: run_step(template, &Steps.create_task(&1, attrs), :task)

  defp update_task(template, task, attrs) do
    run_step(template, &(&1 |> Ecto.Multi.put(:task, task) |> Steps.update_task(attrs)), :updated_task)
  end

  defp delete_task(template, task) do
    run_step(template, &(&1 |> Ecto.Multi.put(:task, task) |> Steps.delete_task()), :deleted_task)
  end

  defp run_step(template, add_step, result_key) do
    result =
      Ecto.Multi.new()
      |> Ecto.Multi.put(:template, template)
      |> add_step.()
      |> Steps.commit()

    case result do
      {:ok, changes} -> {:ok, Map.fetch!(changes, result_key)}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end
end
