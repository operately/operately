defmodule OperatelyWeb.Api.WorkMaps.SaveLayoutAndHierarchyTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias OperatelyWeb.Paths
  import Operately.KpisFixtures
  import Ecto.Query, only: [from: 2]

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, company_permissions: Binding.view_access())
    |> Factory.add_space_member(:editor, :space, permissions: :edit_access)
    |> Factory.add_company_member(:viewer)
    |> Factory.set_company_access_level(:viewer, Binding.view_access())
    |> Factory.log_in_person(:creator)
  end

  test "rejects empty saves and incomplete filters without changing the shared default", ctx do
    assert {400, _} = save(ctx, %{})
    assert {400, _} = save(ctx, %{default_view: %{filters: [%{field: "name"}]}})
    assert {200, %{default_view: nil}} = read(ctx)
  end

  test "write access follows the map scope and respects read-only billing", ctx do
    space = %{space_id: Paths.space_id(ctx.space)}
    viewer = Factory.log_in_person(ctx, :viewer)
    editor = Factory.log_in_person(ctx, :editor)
    attrs = %{default_view: %{show_kpis: true}}

    assert {403, _} = save(viewer, attrs)
    assert {403, _} = save(viewer, Map.merge(attrs, space))
    assert {200, %{can_edit: false}} = read(viewer, space)
    assert {200, _} = save(editor, Map.merge(attrs, space))

    # A company editor need not be an administrator.
    ctx = Factory.set_company_access_level(ctx, :editor, Binding.edit_access())
    assert {200, _} = save(Factory.log_in_person(ctx, :editor), attrs)

    %{company_id: ctx.company.id, access_state: :read_only}
    |> Operately.Billing.CompanyBillingAccount.changeset()
    |> Operately.Repo.insert!()

    assert {403, _} = save(ctx, attrs)
    assert {403, _} = save(ctx, Map.merge(attrs, space))
  end

  test "reordering visible work preserves hidden siblings and the independent space order", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:a, :space, goal: :goal)
      |> Factory.add_project(:b, :space, goal: :goal)
      |> Factory.add_project(:secret, :space, goal: :goal, space_access_level: Binding.no_access(), company_access_level: Binding.no_access())

    [a, b, secret] = Enum.map([ctx.a, ctx.b, ctx.secret], &Paths.project_id/1)
    space = %{space_id: Paths.space_id(ctx.space)}
    assert {200, _} = save(ctx, %{ordered_item_ids: [b, a]})
    assert {200, _} = save(ctx, Map.merge(space, %{ordered_item_ids: [a, secret, b]}))

    editor = Factory.log_in_person(ctx, :editor)
    assert {200, %{ordered_item_ids: [^a, ^b]}} = read(editor, space)
    assert {400, _} = save(editor, Map.merge(space, %{ordered_item_ids: [secret]}))
    assert {200, _} = save(editor, Map.merge(space, %{ordered_item_ids: [b, a]}))
    assert {200, %{ordered_item_ids: [^b, ^secret, ^a]}} = read(ctx, space)
    assert {200, %{ordered_item_ids: [^b, ^a]}} = read(ctx)
  end

  test "pin updates preserve inaccessible KPIs and enforce the shared three-pin limit", ctx do
    ctx =
      ctx
      |> Factory.add_space(:secret, company_permissions: Binding.no_access())
      |> Factory.set_company_access_level(:editor, Binding.edit_access())

    hidden = kpi_fixture(ctx.creator, %{space_id: ctx.secret.id, name: "Private KPI"})
    [a, b, c] = for name <- ["Public A", "Public B", "Public C"], do: kpi_fixture(ctx.creator, %{space_id: ctx.space.id, name: name})
    [hidden_id, a_id, b_id, c_id] = Enum.map([hidden, a, b, c], &Paths.kpi_id/1)
    assert {200, _} = save(ctx, %{pinned_kpi_ids: [a_id, hidden_id]})

    editor = Factory.log_in_person(ctx, :editor)
    assert {200, %{pinned_kpis: [%{id: ^a_id}]}} = read(editor)
    assert {400, _} = save(editor, %{pinned_kpi_ids: [hidden_id]})
    assert {400, _} = save(editor, %{pinned_kpi_ids: [a_id, b_id, c_id]})
    assert {200, _} = save(editor, %{pinned_kpi_ids: [b_id, a_id]})
    assert {200, %{pinned_kpis: [%{id: ^b_id}, %{id: ^hidden_id}, %{id: ^a_id}]}} = read(ctx)
    assert {200, _} = save(editor, %{pinned_kpi_ids: []})
    assert {200, %{pinned_kpis: [%{id: ^hidden_id}]}} = read(ctx)
    assert {400, _} = save(ctx, %{space_id: Paths.space_id(ctx.space), pinned_kpi_ids: [hidden_id]})
  end

  test "moving a project also requires permission to edit the project", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space, space_access_level: Binding.view_access(), company_access_level: Binding.view_access())
      |> Factory.log_in_person(:editor)

    move = %{type: "project", item_id: Paths.project_id(ctx.project), parent_id: Paths.goal_id(ctx.goal)}
    assert {403, _} = save(ctx, %{space_id: Paths.space_id(ctx.space), parent_changes: [move]})
    assert is_nil(Operately.Repo.reload!(ctx.project).goal_id)
  end

  test "detaching a visible project keeps its inaccessible previous goal out of the activity", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:private_goal, :space, company_access: Binding.no_access(), space_access: Binding.no_access())
      |> Factory.add_project(:project, :space, goal: :private_goal)
      |> Factory.log_in_person(:editor)

    move = %{type: "project", item_id: Paths.project_id(ctx.project), parent_id: nil}
    assert {200, _} = save(ctx, %{space_id: Paths.space_id(ctx.space), parent_changes: [move]})
    activity = Operately.Repo.one!(from a in Operately.Activities.Activity, where: a.action == "project_goal_connection")
    assert is_nil(activity.content["previous_goal_name"])
    assert is_nil(activity.content["previous_goal_id"])
  end

  test "parent and order changes commit together and reuse hierarchy validation and activities", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal(:child, :space, parent_goal: :goal)
      |> Factory.add_project(:project, :space)

    project = Paths.project_id(ctx.project)
    goal = Paths.goal_id(ctx.goal)
    attach = %{type: "project", item_id: project, parent_id: goal}
    cycle = %{type: "goal", item_id: goal, parent_id: Paths.goal_id(ctx.child)}
    attrs = %{ordered_item_ids: [project, goal]}

    assert {400, _} = save(ctx, Map.put(attrs, :parent_changes, [attach, cycle]))
    assert Operately.Repo.reload!(ctx.project).goal_id == nil
    assert {200, %{ordered_item_ids: []}} = read(ctx)

    assert {200, _} = save(ctx, Map.put(attrs, :parent_changes, [attach]))
    assert Operately.Repo.reload!(ctx.project).goal_id == ctx.goal.id
    assert [_activity] = Operately.Repo.all(from a in Operately.Activities.Activity, where: a.action == "project_goal_connection")
    assert {200, %{success: true}} = save(ctx, %{parent_changes: [%{attach | parent_id: Paths.goal_id(ctx.child)}]})
    assert Operately.Repo.reload!(ctx.project).goal_id == ctx.child.id
    assert {200, %{ordered_item_ids: [^project, ^goal]}} = read(ctx)
  end

  defp read(ctx, scope \\ %{}), do: query(ctx.conn, [:work_maps, :get_settings], scope)
  defp save(ctx, attrs), do: mutation(ctx.conn, [:work_maps, :save_layout_and_hierarchy], attrs)
end
