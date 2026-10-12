defmodule OperatelyWeb.Api.CuratedTemplates.InstantiateTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.log_in_person(:creator)
  end

  for type <- [:goal, :project, :kpi] do
    test "creates an independent #{type} on each submission", ctx do
      ctx = Factory.add_curated_template(ctx, :template, type: unquote(type), published: true)
      inputs = inputs(ctx)
      assert {200, first} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs)
      assert first.resource_type == Atom.to_string(unquote(type))
      assert {200, second} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs)
      assert first.resource_id != second.resource_id
    end
  end

  test "drafts cannot be instantiated", ctx do
    ctx = Factory.add_curated_template(ctx, :template)
    assert {404, _} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs(ctx))
  end

  test "loads the latest published definition on every submission", ctx do
    ctx = Factory.add_curated_template(ctx, :template, type: :goal, published: true)
    inputs = inputs(ctx)
    assert {200, _} = query(ctx.conn, [:curated_templates, :get], %{id: ctx.template.id})
    definition = Map.merge(ctx.template.definition, %{"name" => "Latest name", "duration_days" => 20})
    {:ok, updated} = Operately.Operations.CuratedTemplateUpdating.run(ctx.template, ctx.account, ctx.template.updated_at, {:update, %{definition: definition}})
    assert {200, first} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs)
    goal = Repo.get!(Operately.Goals.Goal, Operately.ShortUuid.decode!(first.resource_id)) |> Repo.preload(:targets)
    assert goal.name == "Latest name"
    assert goal.parent_goal_id == nil
    assert goal.champion_id == nil
    assert goal.reviewer_id == nil
    assert Operately.ContextualDates.Timeframe.start_date(goal.timeframe) == ~D[2026-10-12]
    assert Operately.ContextualDates.Timeframe.end_date(goal.timeframe) == ~D[2026-11-01]
    assert [%{index: 0, from: 10.0, to: 5.0, value: 10.0}] = goal.targets
    {:ok, _} = Operately.Operations.CuratedTemplateUpdating.run(updated, ctx.account, updated.updated_at, {:update, %{definition: %{definition | "name" => "Later name"}}})
    assert {200, second} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs)
    assert first.resource_id != second.resource_id
    assert Repo.get!(Operately.Goals.Goal, Operately.ShortUuid.decode!(second.resource_id)).name == "Later name"
    assert Repo.get!(Operately.Goals.Goal, goal.id).name == "Latest name"
  end

  test "projects have ordered fresh children, matching workflow and calendar dates", ctx do
    description = %{"type" => "doc", "content" => [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => "Task description"}]}]}

    definition = %{
      "name" => "Launch",
      "duration_days" => 30,
      "milestones" => [%{"key" => "first", "title" => "First", "due_offset_days" => 2}, %{"key" => "second", "title" => "Second"}],
      "tasks" => [
        %{"key" => "a", "name" => "A", "milestone_key" => "first", "description" => description, "due_offset_days" => 1},
        %{"key" => "b", "name" => "B", "milestone_key" => "first"},
        %{"key" => "c", "name" => "C"}
      ]
    }

    ctx = Factory.add_curated_template(ctx, :template, type: :project, published: true, definition: definition)
    assert {200, result} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs(ctx))
    project = Repo.get!(Operately.Projects.Project, Operately.ShortUuid.decode!(result.resource_id)) |> Repo.preload([:milestones, :tasks])
    assert project.goal_id == nil
    assert Operately.ContextualDates.Timeframe.end_date(project.timeframe) == ~D[2026-11-11]
    milestones = Enum.sort_by(project.milestones, & &1.title)
    assert project.milestones_ordering_state == Enum.map(milestones, &Paths.milestone_id/1)
    [first, second] = milestones
    assert Operately.ContextualDates.Timeframe.end_date(first.timeframe) == ~D[2026-10-14]
    assert Operately.ContextualDates.Timeframe.end_date(second.timeframe) == nil
    [a, b, c] = Enum.sort_by(project.tasks, & &1.name)
    assert a.milestone_id == first.id
    assert b.milestone_id == first.id
    assert c.milestone_id == nil
    assert a.description == description
    assert a.due_date.date == ~D[2026-10-13]
    assert b.due_date == nil
    assert a.task_status.id == hd(project.task_statuses).id
    assert first.tasks_ordering_state == [Paths.task_id(a), Paths.task_id(b)]
    assert project.tasks_kanban_state["pending"] == [Paths.task_id(c)]
    assert Enum.all?(project.tasks, & &1.subscription_list_id)
  end

  test "KPI keeps template configuration and ownership without entries", ctx do
    ctx = ctx |> Factory.add_curated_template(:template, published: true) |> Factory.add_space_member(:champion, :space)
    assert {200, result} = mutation(ctx.conn, [:curated_templates, :instantiate], Map.put(inputs(ctx), :champion_id, ctx.champion.id))
    kpi = Repo.get!(Operately.Kpis.Kpi, Operately.ShortUuid.decode!(result.resource_id)) |> Repo.preload(:entries)
    assert kpi.champion_id == ctx.champion.id
    assert kpi.name == "Revenue"
    assert kpi.unit == "USD"
    assert kpi.cadence == :monthly
    assert kpi.entries == []
  end

  for {permission, status} <- [no_access: 404, view_access: 403, comment_access: 403, edit_access: 200] do
    test "requires edit access: #{permission}", ctx do
      ctx = ctx |> Factory.add_curated_template(:template, published: true) |> Factory.add_company_member(:member) |> Factory.log_in_person(:member)
      ctx = Factory.add_space(ctx, :space, company_permissions: Operately.Access.Binding.from_atom(unquote(permission)))
      assert {unquote(status), _} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs(ctx))
    end
  end

  test "rejects read-only companies", ctx do
    ctx = Factory.add_curated_template(ctx, :template, published: true)
    %{company_id: ctx.company.id, access_state: :read_only} |> Operately.Billing.CompanyBillingAccount.changeset() |> Repo.insert!()
    assert {403, _} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs(ctx))
    assert Repo.aggregate(Operately.Kpis.Kpi, :count) == 0
  end

  test "disallows identical owners and preserves private space access defaults", ctx do
    ctx = ctx |> Factory.add_curated_template(:template, type: :goal, published: true) |> Factory.add_space_member(:champion, :space)
    assert {400, _} = mutation(ctx.conn, [:curated_templates, :instantiate], Map.merge(inputs(ctx), %{champion_id: ctx.champion.id, reviewer_id: ctx.champion.id}))
    assert {200, result} = mutation(ctx.conn, [:curated_templates, :instantiate], Map.merge(inputs(ctx), %{champion_id: ctx.champion.id, reviewer_id: ctx.creator.id}))
    goal = Repo.get!(Operately.Goals.Goal, Operately.ShortUuid.decode!(result.resource_id))
    assert goal.champion_id == ctx.champion.id
    assert goal.reviewer_id == ctx.creator.id
    levels = Operately.Access.AccessLevels.load(Operately.Access.get_context!(goal_id: goal.id).id, ctx.company.id, ctx.space.id)
    assert levels.public == 0
    assert levels.company == 0
    assert levels.space == Operately.Access.Binding.comment_access()
  end

  for type <- [:goal, :project, :kpi], champion <- [:guest, :champion] do
    test "guest with edit access creates #{type} with #{champion} as champion", ctx do
      type = unquote(type)
      ctx =
        ctx
        |> Factory.add_curated_template(:template, type: type, published: true)
        |> Factory.add_company_member(:guest)
        |> Factory.add_space_member(:champion, :space)
        |> Factory.add_space_member(:reviewer, :space)

      {:ok, guest} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.creator, ctx.guest)
      {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{id: guest.id, access_level: Operately.Access.Binding.edit_access()}])
      ctx = ctx |> Map.put(:guest, guest) |> Factory.log_in_person(:guest)

      assert {:error, :not_found} = Operately.People.Person.get(ctx.guest, id: ctx.guest.id)
      champion_id = Map.fetch!(ctx, unquote(champion)).id
      reviewer_id = if type == :kpi, do: nil, else: ctx.reviewer.id
      inputs = Map.merge(inputs(ctx), %{champion_id: champion_id, reviewer_id: reviewer_id})

      assert {200, result} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs)
      resource_id = Operately.ShortUuid.decode!(result.resource_id)

      case type do
        :goal ->
          goal = Repo.get!(Operately.Goals.Goal, resource_id)
          assert goal.champion_id == champion_id
          assert goal.reviewer_id == reviewer_id

        :project ->
          project = Repo.get!(Operately.Projects.Project, resource_id) |> Repo.preload(:contributors)
          owners = Map.new(project.contributors, &{&1.role, &1.person_id})
          assert owners[:champion] == champion_id
          assert owners[:reviewer] == reviewer_id

        :kpi ->
          assert Repo.get!(Operately.Kpis.Kpi, resource_id).champion_id == champion_id
      end
    end
  end

  test "accepts project owners without existing destination access, like normal project creation", ctx do
    ctx =
      ctx
      |> Factory.add_curated_template(:template, type: :project, published: true)
      |> Factory.add_company_member(:champion)
      |> Factory.add_company_member(:reviewer)

    assert {:error, :not_found} = Operately.Groups.Group.get(ctx.champion, id: ctx.space.id)
    assert {:error, :not_found} = Operately.Groups.Group.get(ctx.reviewer, id: ctx.space.id)
    inputs = Map.merge(inputs(ctx), %{champion_id: ctx.champion.id, reviewer_id: ctx.reviewer.id})
    assert {200, result} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs)
    project = Repo.get!(Operately.Projects.Project, Operately.ShortUuid.decode!(result.resource_id)) |> Repo.preload(:contributors)
    owners = Map.new(project.contributors, &{&1.role, &1.person_id})
    assert owners[:champion] == ctx.champion.id
    assert owners[:reviewer] == ctx.reviewer.id
  end

  test "requires start dates for goals and projects", ctx do
    for type <- [:goal, :project] do
      ctx = Factory.add_curated_template(ctx, :template, type: type, published: true)
      assert {400, _} = mutation(ctx.conn, [:curated_templates, :instantiate], Map.delete(inputs(ctx), :start_date))
    end
  end

  for type <- [:goal, :project, :kpi], role <- [:champion_id, :reviewer_id], type != :kpi or role == :champion_id do
    for invalid_owner <- [:other_company, :missing, :suspended, :suspended_at] do
      test "rejects #{invalid_owner} #{role} for #{type} without creating anything", ctx do
        ctx = Factory.add_curated_template(ctx, :template, type: unquote(type), published: true)
        owner_id = invalid_owner_id(ctx, unquote(invalid_owner))

        schemas = [
          Operately.Goals.Goal,
          Operately.Projects.Project,
          Operately.Kpis.Kpi,
          Operately.Access.Binding,
          Operately.Activities.Activity,
          Operately.Notifications.SubscriptionList,
          Operately.Notifications.Subscription
        ]

        before = Enum.map(schemas, &Repo.aggregate(&1, :count))
        assert {400, _} = mutation(ctx.conn, [:curated_templates, :instantiate], Map.put(inputs(ctx), unquote(role), owner_id))
        assert Enum.map(schemas, &Repo.aggregate(&1, :count)) == before
      end
    end
  end

  test "a child failure rolls back the parent, subscriptions, activities and access records", ctx do
    ctx = Factory.add_curated_template(ctx, :template, type: :project, published: true)
    # Simulate an invalid stored child to exercise failure after parent creation.
    definition = Map.put(ctx.template.definition, "tasks", [%{"key" => "bad", "name" => ""}])
    ctx.template |> Ecto.Changeset.change(definition: definition) |> Repo.update!()

    schemas = [
      Operately.Projects.Project,
      Operately.ResourceHubs.ResourceHub,
      Operately.Notifications.SubscriptionList,
      Operately.Activities.Activity,
      Operately.Access.Binding
    ]

    before = Enum.map(schemas, &Repo.aggregate(&1, :count))
    assert {500, _} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs(ctx))
    assert Enum.map(schemas, &Repo.aggregate(&1, :count)) == before
  end

  test "anonymous requests and catalog visits cannot create resources", ctx do
    ctx = Factory.add_curated_template(ctx, :template, published: true)
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:curated_templates, :instantiate], inputs(ctx))
    assert {200, _} = query(ctx.conn, [:curated_templates, :get], %{id: ctx.template.id})
    assert Repo.aggregate(Operately.Kpis.Kpi, :count) == 0
  end

  test "removed templates cannot be instantiated", ctx do
    ctx = Factory.add_curated_template(ctx, :template, published: true)
    Repo.delete!(ctx.template)
    assert {404, _} = mutation(ctx.conn, [:curated_templates, :instantiate], inputs(ctx))
    assert Repo.aggregate(Operately.Kpis.Kpi, :count) == 0
  end

  test "rejects destinations from another company", ctx do
    ctx = Factory.add_curated_template(ctx, :template, published: true)
    other = Factory.setup(%{})
    assert {404, _} = mutation(ctx.conn, [:curated_templates, :instantiate], %{inputs(ctx) | space_id: other.company.company_space_id})
  end

  defp inputs(ctx) do
    %{template_id: ctx.template.id, space_id: ctx.space.id, start_date: "2026-10-12"}
  end

  defp invalid_owner_id(_ctx, :other_company), do: Factory.setup(%{}).creator.id
  defp invalid_owner_id(_ctx, :missing), do: Ecto.UUID.generate()

  defp invalid_owner_id(ctx, suspension_field) do
    ctx = Factory.add_company_member(ctx, :invalid_owner)
    value = if suspension_field == :suspended, do: true, else: DateTime.utc_now() |> DateTime.truncate(:second)
    ctx.invalid_owner |> Ecto.Changeset.change(%{suspension_field => value}) |> Repo.update!()
    ctx.invalid_owner.id
  end
end
