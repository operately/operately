defmodule Operately.Operations.CuratedTemplateInstantiationTest do
  use Operately.DataCase

  alias Operately.Access.{AccessLevels, Binding}
  alias Operately.Activities.Activity
  alias Operately.ContextualDates.Timeframe
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Kpis.Kpi
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.Operations.CuratedTemplateInstantiation
  alias Operately.Operations.CuratedTemplateInstantiation.Result
  alias Operately.Projects.Project
  alias Operately.Support.RichText
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
  end

  test "creates a goal with template content, ownership and ordered targets at their baselines", ctx do
    definition = %{
      "name" => "Improve retention",
      "description" => RichText.rich_text("Help customers succeed"),
      "duration_days" => 4,
      "targets" => [
        %{"name" => "Retention", "unit" => "%", "from" => 65, "to" => 90},
        %{"name" => "Churn", "unit" => "%", "from" => 10, "to" => 5}
      ]
    }

    goal = instantiate(ctx, :goal, definition, champion_id: ctx.champion.id, reviewer_id: ctx.reviewer.id) |> Repo.preload(:targets)

    assert goal.name == definition["name"]
    assert goal.description == definition["description"]
    assert goal.company_id == ctx.company.id
    assert goal.group_id == ctx.space.id
    assert goal.creator_id == ctx.creator.id
    assert goal.champion_id == ctx.champion.id
    assert goal.reviewer_id == ctx.reviewer.id
    assert goal.parent_goal_id == nil
    assert Timeframe.start_date(goal.timeframe) == ~D[2028-02-28]
    assert Timeframe.end_date(goal.timeframe) == ~D[2028-03-03]

    assert [
             %{index: 0, name: "Retention", unit: "%", from: 65.0, to: 90.0, value: 65.0},
             %{index: 1, name: "Churn", unit: "%", from: 10.0, to: 5.0, value: 10.0}
           ] = Enum.sort_by(goal.targets, & &1.index)

    assert [_hub] = Operately.ResourceHubs.list_resource_hubs(goal)
    assert_created_activity(ctx, :goal, goal)
  end

  test "creates a project with ordered children, resolved references, dates and normal workflow", ctx do
    definition = project_definition()
    project = instantiate(ctx, :project, definition, champion_id: ctx.champion.id, reviewer_id: ctx.reviewer.id)
    project = Repo.preload(project, [:milestones, :tasks, :contributors])

    assert project.name == definition["name"]
    assert project.description == definition["description"]
    assert project.company_id == ctx.company.id
    assert project.group_id == ctx.space.id
    assert project.creator_id == ctx.creator.id
    assert project.goal_id == nil
    assert Timeframe.start_date(project.timeframe) == ~D[2028-02-28]
    assert Timeframe.end_date(project.timeframe) == ~D[2028-03-03]
    assert Enum.map(project.task_statuses, & &1.value) == ["pending", "in_progress", "done", "canceled"]

    roles = Map.new(project.contributors, &{&1.person_id, &1.role})
    assert roles == %{ctx.creator.id => :contributor, ctx.champion.id => :champion, ctx.reviewer.id => :reviewer}

    milestones = Map.new(project.milestones, &{&1.title, &1})
    tasks = Map.new(project.tasks, &{&1.name, &1})
    first = milestones["Z milestone"]
    second = milestones["A milestone"]
    assert project.milestones_ordering_state == [Paths.milestone_id(first), Paths.milestone_id(second)]
    assert Timeframe.end_date(first.timeframe) == ~D[2028-03-01]
    assert Timeframe.end_date(second.timeframe) == nil
    assert Enum.all?(project.milestones, &(&1.status == :pending))

    assert tasks["Z task"].milestone_id == first.id
    assert tasks["A task"].milestone_id == first.id
    assert tasks["Unassigned Z"].milestone_id == nil
    assert tasks["Unassigned A"].milestone_id == nil
    assert tasks["Z task"].description == RichText.rich_text("Prepare the release")
    assert tasks["A task"].description == %{"type" => "doc", "content" => []}
    assert tasks["Z task"].due_date.date == ~D[2028-02-28]
    assert tasks["A task"].due_date == nil
    assert first.tasks_ordering_state == [Paths.task_id(tasks["Z task"]), Paths.task_id(tasks["A task"])]
    assert first.tasks_kanban_state["pending"] == first.tasks_ordering_state
    assert second.tasks_ordering_state == []
    assert project.tasks_kanban_state["pending"] == [Paths.task_id(tasks["Unassigned Z"]), Paths.task_id(tasks["Unassigned A"])]

    for task <- project.tasks do
      assert task.project_id == project.id
      assert task.task_status.id == hd(project.task_statuses).id
      assert task.closed_at == nil
      assert Repo.get!(SubscriptionList, task.subscription_list_id).parent_id == task.id
      assert Repo.get_by!(Subscription, subscription_list_id: task.subscription_list_id, person_id: ctx.creator.id)
    end

    for milestone <- project.milestones do
      assert Repo.get!(SubscriptionList, milestone.subscription_list_id).parent_id == milestone.id
    end

    assert [_hub] = Operately.ResourceHubs.list_resource_hubs(project)
    assert_created_activity(ctx, :project, project)
  end

  test "each project copy has fresh child IDs and references only its own milestones", ctx do
    ctx = Factory.add_curated_template(ctx, :template, type: :project, published: true)
    inputs = %{template_id: ctx.template.id, start_date: ~D[2028-02-28]}
    space = Group.preload_access_levels(ctx.space)

    assert {:ok, first} = CuratedTemplateInstantiation.run(ctx.creator, space, inputs)
    assert {:ok, second} = CuratedTemplateInstantiation.run(ctx.creator, space, inputs)
    refute first.resource_id == second.resource_id

    first = Repo.get!(Project, first.resource_id) |> Repo.preload([:milestones, :tasks])
    second = Repo.get!(Project, second.resource_id) |> Repo.preload([:milestones, :tasks])
    assert [first_milestone] = first.milestones
    assert [second_milestone] = second.milestones
    assert [first_task] = first.tasks
    assert [second_task] = second.tasks
    refute first_milestone.id == second_milestone.id
    refute first_task.id == second_task.id
    assert first_task.milestone_id == first_milestone.id
    assert second_task.milestone_id == second_milestone.id
  end

  test "creates a KPI with configuration, ownership and subscriptions but no historical data", ctx do
    definition = %{"name" => "Weekly revenue", "description" => RichText.rich_text("Track sales"), "unit" => "USD", "cadence" => "weekly"}
    kpi = instantiate(ctx, :kpi, definition, champion_id: ctx.champion.id) |> Repo.preload([:entries, :annotations])

    assert kpi.name == definition["name"]
    assert kpi.description == definition["description"]
    assert kpi.space_id == ctx.space.id
    assert kpi.champion_id == ctx.champion.id
    assert kpi.unit == "USD"
    assert kpi.cadence == :weekly
    assert kpi.entries == []
    assert kpi.annotations == []
    assert Repo.get!(SubscriptionList, kpi.subscription_list_id).parent_id == kpi.id
    assert Repo.get_by!(Subscription, subscription_list_id: kpi.subscription_list_id, person_id: ctx.creator.id).type == :joined
    assert Repo.get_by!(Subscription, subscription_list_id: kpi.subscription_list_id, person_id: ctx.champion.id).type == :invited
    assert_created_activity(ctx, :kpi, kpi)
  end

  test "creates an unassigned KPI without a start date", ctx do
    kpi = instantiate(ctx, :kpi, Factory.CuratedTemplates.definition(:kpi))
    assert kpi.champion_id == nil
    assert kpi.cadence == :monthly
  end

  for type <- [:goal, :project] do
    test "leaves optional dates and owners unset for #{type}", ctx do
      type = unquote(type)
      resource = instantiate(ctx, type, Factory.CuratedTemplates.definition(type))

      assert Timeframe.start_date(resource.timeframe) == ~D[2028-02-28]
      assert Timeframe.end_date(resource.timeframe) == nil

      case resource do
        %Goal{} ->
          assert resource.champion_id == nil
          assert resource.reviewer_id == nil

        %Project{} ->
          assert [%{person_id: creator_id, role: :contributor}] = Repo.preload(resource, :contributors).contributors
          assert creator_id == ctx.creator.id
      end
    end

    for permission <- [:no_access, :view_access] do
      test "#{type} inherits #{permission} company access from its destination without anonymous access", ctx do
        type = unquote(type)
        company_level = Binding.from_atom(unquote(permission))
        ctx = Factory.add_space(ctx, :space, company_permissions: company_level)
        resource = instantiate(ctx, type, Factory.CuratedTemplates.definition(type))
        context = Operately.Access.get_context!([{String.to_existing_atom("#{type}_id"), resource.id}])
        levels = AccessLevels.load(context.id, ctx.company.id, ctx.space.id)

        assert levels.company == company_level
        assert levels.space == Binding.comment_access()
        assert levels.public == Binding.no_access()
      end
    end
  end

  test "a later task failure rolls back the project, earlier children and supporting records", ctx do
    ctx = Factory.add_curated_template(ctx, :template, type: :project, published: true, definition: project_definition())
    # Corrupt the stored final task to exercise failure after earlier children are inserted.
    tasks = List.update_at(ctx.template.definition["tasks"], -1, &Map.put(&1, "name", ""))
    ctx.template |> Ecto.Changeset.change(definition: Map.put(ctx.template.definition, "tasks", tasks)) |> Repo.update!()

    schemas = [
      Project,
      Operately.Projects.Milestone,
      Operately.Tasks.Task,
      Operately.Projects.Contributor,
      Operately.ResourceHubs.ResourceHub,
      SubscriptionList,
      Subscription,
      Activity,
      Operately.Access.Context,
      Binding
    ]

    before = Enum.map(schemas, &Repo.aggregate(&1, :count))
    inputs = %{template_id: ctx.template.id, start_date: ~D[2028-02-28], champion_id: ctx.champion.id, reviewer_id: ctx.reviewer.id}

    assert {:error, {:invalid_child, :task, changeset}} = CuratedTemplateInstantiation.run(ctx.creator, Group.preload_access_levels(ctx.space), inputs)
    assert errors_on(changeset).name == ["can't be blank"]
    assert Enum.map(schemas, &Repo.aggregate(&1, :count)) == before
  end

  defp instantiate(ctx, type, definition, settings \\ []) do
    ctx = Factory.add_curated_template(ctx, :template, type: type, published: true, definition: definition)
    inputs = Map.merge(%{template_id: ctx.template.id}, Map.new(settings))
    inputs = if type == :kpi, do: inputs, else: Map.put(inputs, :start_date, ~D[2028-02-28])
    space = Group.preload_access_levels(ctx.space)

    assert {:ok, %Result{resource_type: ^type, resource_id: id, space_id: space_id}} = CuratedTemplateInstantiation.run(ctx.creator, space, inputs)
    assert space_id == space.id

    schema =
      case type do
        :goal -> Goal
        :project -> Project
        :kpi -> Kpi
      end

    Repo.get!(schema, id)
  end

  defp assert_created_activity(ctx, type, resource) do
    activity = Repo.get_by!(Activity, action: "#{type}_created")
    assert activity.author_id == ctx.creator.id
    assert activity.content["#{type}_id"] == resource.id
    assert activity.content["space_id"] == ctx.space.id
  end

  defp project_definition do
    %{
      "name" => "Launch",
      "description" => RichText.rich_text("Ship the product"),
      "duration_days" => 4,
      "milestones" => [%{"key" => "first", "title" => "Z milestone", "due_offset_days" => 2}, %{"key" => "second", "title" => "A milestone"}],
      "tasks" => [
        %{"key" => "first-task", "name" => "Z task", "milestone_key" => "first", "description" => RichText.rich_text("Prepare the release"), "due_offset_days" => 0},
        %{"key" => "second-task", "name" => "A task", "milestone_key" => "first"},
        %{"key" => "unassigned-z", "name" => "Unassigned Z"},
        %{"key" => "unassigned-a", "name" => "Unassigned A"}
      ]
    }
  end
end
