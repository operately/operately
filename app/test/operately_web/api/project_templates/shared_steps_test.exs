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
    assert Enum.all?(template.tasks_kanban_state, fn {_status, task_ids} -> task_ids == [] end)
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

  test "creates, updates, moves, and deletes milestones and tasks while keeping state synchronized", ctx do
    status = hd(ctx.template.task_statuses)

    assert {:ok, milestone} = create_milestone(ctx.template, %{title: "Ship", due_offset_days: 0})
    template = Repo.reload!(ctx.template)
    assert template.milestones_ordering_state == [Paths.project_template_milestone_id(milestone)]

    assert {:ok, root_task} = create_task(template, %{name: "Root", description: %{}, task_status: Map.from_struct(status)})
    template = Repo.reload!(template)
    assert template.tasks_kanban_state[status.value] == [Paths.project_template_task_id(root_task)]

    assert {:ok, moved_task} = update_task(template, root_task, %{project_template_milestone_id: milestone.id, due_offset_days: 7})
    template = Repo.reload!(template)
    milestone = Repo.reload!(milestone)
    assert moved_task.project_template_milestone_id == milestone.id
    assert template.tasks_kanban_state[status.value] == [Paths.project_template_task_id(moved_task)]
    assert milestone.tasks_ordering_state == [Paths.project_template_task_id(moved_task)]
    assert milestone.tasks_kanban_state[status.value] == [Paths.project_template_task_id(moved_task)]

    assert {:ok, updated_milestone} = update_milestone(template, milestone, %{title: "Launch", due_offset_days: 14})
    assert updated_milestone.title == "Launch"
    assert updated_milestone.due_offset_days == 14

    assert {:ok, _task} = delete_task(template, moved_task)
    milestone = Repo.reload!(milestone)
    assert milestone.tasks_ordering_state == []
    assert milestone.tasks_kanban_state[status.value] == []

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

  test "replaces deleted statuses across tasks and rebuilds Kanban state", ctx do
    [old_status, replacement | _] = ctx.template.task_statuses

    assert {:ok, task} = create_task(ctx.template, %{name: "Task", description: %{}, task_status: Map.from_struct(old_status)})

    statuses = Enum.reject(ctx.template.task_statuses, &(&1.id == old_status.id))

    assert {:ok, template} =
             update_template(Repo.reload!(ctx.template), %{
               task_statuses: Enum.map(statuses, &Map.from_struct/1),
               deleted_status_replacements: [%{deleted_status_id: old_status.id, replacement_status_id: replacement.id}]
             })

    task = Repo.reload!(task)
    assert task.task_status.id == replacement.id
    assert template.tasks_kanban_state[replacement.value] == [Paths.project_template_task_id(task)]
    refute Map.has_key?(template.tasks_kanban_state, old_status.value)
  end

  test "workflow rebuild reads do not grow with populated or empty milestones", ctx do
    small = add_workflow_fixture(ctx, :template, :small, 1, 1)

    large =
      ctx
      |> Factory.add_project_template(:large_template, :space)
      |> add_workflow_fixture(:large_template, :large, 3, 2)

    {small_result, small_reads} = count_template_selects(fn -> replace_first_status(small.template) end)
    {large_result, large_reads} = count_template_selects(fn -> replace_first_status(large.large_template) end)

    assert {:ok, _template} = small_result
    assert {:ok, _template} = large_result
    assert small_reads == large_reads
    assert Map.fetch!(small_reads, "project_template_milestones") > 0
    assert Map.fetch!(small_reads, "project_template_tasks") > 0
  end

  test "workflow rebuild preserves ordering and scopes board and milestone tasks", ctx do
    [deleted_status, replacement_status | remaining_statuses] = ctx.template.task_statuses
    deleted = Map.from_struct(deleted_status)
    replacement = Map.from_struct(replacement_status)

    ctx =
      ctx
      |> Factory.add_project_template_milestone(:first_milestone, :template)
      |> Factory.add_project_template_milestone(:second_milestone, :template)
      |> Factory.add_project_template_milestone(:empty_milestone, :template)
      |> Factory.add_project_template_task(:first_a, :template, milestone: :first_milestone, task_status: deleted)
      |> Factory.add_project_template_task(:first_b, :template, milestone: :first_milestone, task_status: replacement)
      |> Factory.add_project_template_task(:first_c, :template, milestone: :first_milestone, task_status: deleted)
      |> Factory.add_project_template_task(:second_task, :template, milestone: :second_milestone, task_status: deleted)
      |> Factory.add_project_template_task(:root_task, :template, task_status: replacement)
      |> Factory.add_project_template(:other_template, :space)
      |> Factory.add_project_template_task(:other_task, :other_template)

    same_time = ~N[2024-01-01 00:00:00]
    Repo.update!(Ecto.Changeset.change(ctx.first_a, inserted_at: same_time))
    Repo.update!(Ecto.Changeset.change(ctx.first_c, inserted_at: same_time))

    first_a_id = Paths.project_template_task_id(ctx.first_a)
    first_b_id = Paths.project_template_task_id(ctx.first_b)
    first_c_id = Paths.project_template_task_id(ctx.first_c)
    second_id = Paths.project_template_task_id(ctx.second_task)
    root_id = Paths.project_template_task_id(ctx.root_task)

    Repo.update!(
      Milestone.changeset(ctx.first_milestone, %{
        tasks_ordering_state: [first_b_id],
        tasks_kanban_state: %{replacement_status.value => [first_b_id], deleted_status.value => [first_a_id, first_c_id]}
      })
    )

    Repo.update!(
      ProjectTemplate.changeset(ctx.template, %{
        tasks_kanban_state: %{replacement_status.value => [first_b_id, root_id], deleted_status.value => [first_a_id, first_c_id, second_id]}
      })
    )

    other_before = Repo.reload!(ctx.other_template)
    other_task_before = Repo.reload!(ctx.other_task)

    assert {:ok, template} = replace_first_status(Repo.reload!(ctx.template))

    first = Repo.reload!(ctx.first_milestone)
    second = Repo.reload!(ctx.second_milestone)
    empty = Repo.reload!(ctx.empty_milestone)
    appended_ids = [ctx.first_a, ctx.first_c] |> Enum.sort_by(& &1.id) |> Enum.map(&Paths.project_template_task_id/1)
    expected_statuses = Enum.map([replacement_status | remaining_statuses], & &1.value)

    assert first.tasks_ordering_state == [first_b_id | appended_ids]
    assert first.tasks_kanban_state[replacement_status.value] == [first_b_id | appended_ids]
    assert second.tasks_ordering_state == [second_id]
    assert second.tasks_kanban_state[replacement_status.value] == [second_id]
    assert empty.tasks_ordering_state == []
    assert Enum.all?(Map.values(empty.tasks_kanban_state), &(&1 == []))
    assert template.tasks_kanban_state[replacement_status.value] == [first_b_id, root_id | appended_ids] ++ [second_id]

    for state <- [template.tasks_kanban_state, first.tasks_kanban_state, second.tasks_kanban_state, empty.tasks_kanban_state] do
      assert Map.keys(state) |> Enum.sort() == Enum.sort(expected_statuses)
      assert Enum.all?(remaining_statuses, &(state[&1.value] == []))
    end

    for task <- [ctx.first_a, ctx.first_b, ctx.first_c, ctx.second_task, ctx.root_task] do
      assert Repo.reload!(task).task_status.id == replacement_status.id
    end

    assert Repo.reload!(ctx.other_template).tasks_kanban_state == other_before.tasks_kanban_state
    assert Repo.reload!(ctx.other_task).task_status == other_task_before.task_status
  end

  test "rolls back status replacement and rebuilt states after invalid explicit board state", ctx do
    ctx =
      ctx
      |> Factory.add_project_template_milestone(:milestone, :template)
      |> Factory.add_project_template_task(:task, :template, milestone: :milestone)

    template_before = Repo.reload!(ctx.template)
    milestone_before = Repo.reload!(ctx.milestone)
    task_before = Repo.reload!(ctx.task)
    [deleted_status, replacement_status | remaining_statuses] = template_before.task_statuses

    assert {:error, {:validation, "Kanban state contains an unknown status"}} =
             update_template(template_before, %{
               task_statuses: Enum.map([replacement_status | remaining_statuses], &Map.from_struct/1),
               deleted_status_replacements: [%{deleted_status_id: deleted_status.id, replacement_status_id: replacement_status.id}],
               tasks_kanban_state: %{"unknown" => []}
             })

    template_after = Repo.reload!(ctx.template)
    milestone_after = Repo.reload!(ctx.milestone)
    task_after = Repo.reload!(ctx.task)

    assert template_after.task_statuses == template_before.task_statuses
    assert template_after.tasks_kanban_state == template_before.tasks_kanban_state
    assert milestone_after.tasks_ordering_state == milestone_before.tasks_ordering_state
    assert milestone_after.tasks_kanban_state == milestone_before.tasks_kanban_state
    assert task_after.task_status == task_before.task_status
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

  test "rejects foreign ordering and malformed Kanban state", ctx do
    ctx =
      ctx
      |> Factory.add_project_template(:other_template, :space)
      |> Factory.add_project_template_milestone(:other_milestone, :other_template)

    assert {:error, {:validation, "Milestone ordering contains IDs from another template"}} =
             update_template(ctx.template, %{
               milestones_ordering_state: [Paths.project_template_milestone_id(ctx.other_milestone)]
             })

    assert {:error, {:validation, "Kanban state contains an unknown status"}} =
             update_template(ctx.template, %{tasks_kanban_state: %{"unknown" => []}})
  end

  test "accepts milestone tasks in the template-root board kanban", ctx do
    assert {:ok, milestone} = create_milestone(ctx.template, %{title: "Ship"})
    status = hd(ctx.template.task_statuses)

    assert {:ok, milestone_task} =
             create_task(ctx.template, %{
               name: "Milestone task",
               description: %{},
               project_template_milestone_id: milestone.id,
               task_status: Map.from_struct(status)
             })

    task_id = Paths.project_template_task_id(milestone_task)

    assert {:ok, template} =
             update_template(Repo.reload!(ctx.template), %{
               tasks_kanban_state: %{status.value => [task_id]}
             })

    assert template.tasks_kanban_state[status.value] == [task_id]
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

  defp add_workflow_fixture(ctx, template_key, prefix, populated_count, empty_count) do
    Enum.reduce(1..(populated_count + empty_count), ctx, fn index, ctx ->
      milestone_key = :"#{prefix}_milestone_#{index}"
      ctx = Factory.add_project_template_milestone(ctx, milestone_key, template_key)

      if index <= populated_count do
        Factory.add_project_template_task(ctx, :"#{prefix}_task_#{index}", template_key, milestone: milestone_key)
      else
        ctx
      end
    end)
  end

  defp replace_first_status(template) do
    [deleted_status, replacement_status | remaining_statuses] = template.task_statuses

    update_template(template, %{
      task_statuses: Enum.map([replacement_status | remaining_statuses], &Map.from_struct/1),
      deleted_status_replacements: [%{deleted_status_id: deleted_status.id, replacement_status_id: replacement_status.id}]
    })
  end

  defp count_template_selects(fun) do
    handler_id = {__MODULE__, make_ref()}
    caller = self()
    sources = ["project_template_milestones", "project_template_tasks"]

    :telemetry.attach(
      handler_id,
      [:operately, :repo, :query],
      fn _, _, metadata, _ ->
        if self() == caller and metadata.source in sources and String.starts_with?(metadata.query, "SELECT") do
          send(caller, {:template_select, handler_id, metadata.source})
        end
      end,
      nil
    )

    try do
      result = fun.()
      {result, collect_template_selects(handler_id) |> Enum.frequencies()}
    after
      :telemetry.detach(handler_id)
    end
  end

  defp collect_template_selects(handler_id) do
    receive do
      {:template_select, ^handler_id, source} -> [source | collect_template_selects(handler_id)]
    after
      0 -> []
    end
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
