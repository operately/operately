defmodule OperatelyWeb.Api.KpiGoalLinks.SetLinkTest do
  use OperatelyWeb.TurboCase
  use Oban.Testing, repo: Operately.Repo
  import Ecto.Query, only: [from: 2]
  import Operately.KpisFixtures
  alias Operately.Access.Binding

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:metrics, company_permissions: Binding.no_access())
      |> Factory.add_space(:planning)
      |> Factory.add_goal(:goal, :planning)
      |> Factory.add_goal(:other_goal, :planning)
      |> Factory.add_goal(:private_goal, :planning, company_access: Binding.no_access(), space_access: Binding.no_access())
      |> Factory.add_space_member(:editor, :metrics)
      |> Factory.add_space_member(:viewer, :metrics, permissions: :view_access)
      |> Factory.add_company_member(:outsider)

    Map.put(ctx, :kpi, kpi_fixture(ctx.creator, space_id: ctx.metrics.id))
  end

  test "a KPI space editor can link to a goal they can only view, from another space", ctx do
    conn = Factory.log_in_person(ctx, :editor).conn
    ids = %{goal_id: Paths.goal_id(ctx.goal), kpi_id: Paths.kpi_id(ctx.kpi)}

    assert {200, %{items: [%{id: kpi_id}]}} = query(conn, [:kpi_goal_links, :search_kpis], %{goal_id: ids.goal_id, query: ""})
    assert kpi_id == ids.kpi_id
    for _ <- 1..2, do: assert({200, _} = mutation(conn, [:kpi_goal_links, :set_link], Map.put(ids, :linked, true)))
    assert {200, %{goal: %{id: goal_id}, can_link: false}} = query(conn, [:kpi_goal_links, :for_kpi], %{kpi_id: kpi_id})
    assert goal_id == ids.goal_id
    assert {200, %{items: [%{id: ^kpi_id, can_unlink: true}]}} = query(conn, [:kpi_goal_links, :for_goal], %{goal_id: goal_id})

    other = %{ids | goal_id: Paths.goal_id(ctx.other_goal)}
    assert {400, _} = mutation(conn, [:kpi_goal_links, :set_link], Map.put(other, :linked, true))
    assert {200, _} = mutation(conn, [:kpi_goal_links, :set_link], Map.put(other, :linked, false))
    assert Operately.Repo.reload!(ctx.kpi).goal_id == ctx.goal.id
    for _ <- 1..2, do: assert({200, _} = mutation(conn, [:kpi_goal_links, :set_link], Map.put(ids, :linked, false)))
    assert is_nil(Operately.Repo.reload!(ctx.kpi).goal_id)

    activities = Repo.all(from a in Operately.Activities.Activity, where: a.action == "kpi_goal_link_changed")
    assert Enum.sort(Enum.map(activities, & &1.content["linked"])) == [false, true]

    for activity <- activities do
      assert activity.author_id == ctx.editor.id
      assert activity.content["kpi_id"] == ctx.kpi.id
      assert activity.content["linked_goal_id"] == ctx.goal.id
    end
  end

  test "the space feed shows the KPI without identifying a private goal", ctx do
    creator = Factory.log_in_person(ctx, :creator).conn
    viewer = Factory.log_in_person(ctx, :viewer).conn
    outsider = Factory.log_in_person(ctx, :outsider).conn
    kpi_id = Paths.kpi_id(ctx.kpi)
    link = %{kpi_id: kpi_id, goal_id: Paths.goal_id(ctx.private_goal), linked: true}
    feed = %{scope_type: "space", scope_id: Paths.space_id(ctx.metrics), actions: ["kpi_goal_link_changed"]}

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {200, _} = mutation(creator, [:kpi_goal_links, :set_link], link)
      activity = Repo.get_by!(Operately.Activities.Activity, action: "kpi_goal_link_changed")
      refute_enqueued worker: Operately.Activities.NotificationDispatcher, args: %{activity_id: activity.id}
    end)

    assert {200, %{activities: [%{content: content}]}} = query(viewer, [:companies, :list_activities], feed)
    assert %{kpi: %{id: ^kpi_id}, linked: true} = content
    refute Map.has_key?(content, :linked_goal_id)
    refute Map.has_key?(content, :goal)
    assert {200, %{activities: []}} = query(outsider, [:companies, :list_activities], feed)
  end

  test "read-only billing preserves visible links and disables changes", ctx do
    conn = Factory.log_in_person(ctx, :editor).conn
    link = %{kpi_id: Paths.kpi_id(ctx.kpi), goal_id: Paths.goal_id(ctx.goal), linked: true}
    assert {200, _} = mutation(conn, [:kpi_goal_links, :set_link], link)
    kpi_fixture(ctx.creator, space_id: ctx.metrics.id)

    %{company_id: ctx.company.id, access_state: :read_only}
    |> Operately.Billing.CompanyBillingAccount.changeset()
    |> Operately.Repo.insert!()

    assert {200, %{items: [%{can_unlink: false}], can_link: false}} = query(conn, [:kpi_goal_links, :for_goal], %{goal_id: link.goal_id})
    assert {403, _} = mutation(conn, [:kpi_goal_links, :set_link], %{link | linked: false})
  end

  test "the goal picker distinguishes matching names without exposing a private space", ctx do
    ctx =
      ctx
      |> Factory.add_space(:private_space, company_permissions: Binding.no_access())
      |> Factory.add_goal(:hidden_space_goal, :private_space, name: "Grow adoption")
      |> Factory.add_goal(:metrics_goal, :metrics, name: "Grow adoption")

    conn = Factory.log_in_person(ctx, :editor).conn
    assert {200, %{items: items}} = query(conn, [:kpi_goal_links, :search_goals], %{kpi_id: Paths.kpi_id(ctx.kpi), query: "Grow adoption"})
    by_id = Map.new(items, &{&1.id, &1})
    assert by_id[Paths.goal_id(ctx.metrics_goal)].space_name == ctx.metrics.name
    refute Map.has_key?(by_id[Paths.goal_id(ctx.hidden_space_goal)], :space_name)
  end

  test "deleting a goal preserves all of its KPIs", ctx do
    conn = Factory.log_in_person(ctx, :creator).conn
    second = kpi_fixture(ctx.creator, space_id: ctx.metrics.id)
    goal_id = Paths.goal_id(ctx.goal)

    for kpi <- [ctx.kpi, second] do
      assert {200, _} = mutation(conn, [:kpi_goal_links, :set_link], %{goal_id: goal_id, kpi_id: Paths.kpi_id(kpi), linked: true})
    end

    assert {200, %{items: items}} = query(conn, [:kpi_goal_links, :for_goal], %{goal_id: goal_id})
    assert MapSet.new(items, & &1.id) == MapSet.new([ctx.kpi, second], &Paths.kpi_id/1)
    assert {:ok, _} = Operately.Operations.GoalDeleting.run(ctx.goal)
    assert {:error, :not_found} = Operately.Operations.KpiGoalLinking.run(ctx.creator, ctx.kpi, ctx.goal, true)
    for kpi <- [ctx.kpi, second], do: assert(is_nil(Operately.Repo.reload!(kpi).goal_id))
  end

  test "reads and writes enforce access on both ends", ctx do
    creator = Factory.log_in_person(ctx, :creator).conn
    editor = Factory.log_in_person(ctx, :editor).conn
    viewer = Factory.log_in_person(ctx, :viewer).conn
    outsider = Factory.log_in_person(ctx, :outsider).conn
    goal_id = Paths.goal_id(ctx.goal)
    kpi_id = Paths.kpi_id(ctx.kpi)
    link = %{kpi_id: kpi_id, goal_id: goal_id, linked: true}
    assert {403, _} = mutation(viewer, [:kpi_goal_links, :set_link], link)
    assert {200, _} = mutation(editor, [:kpi_goal_links, :set_link], link)
    assert {200, %{items: [%{can_unlink: false}]}} = query(viewer, [:kpi_goal_links, :for_goal], %{goal_id: goal_id})
    assert {200, %{items: []}} = query(outsider, [:kpi_goal_links, :for_goal], %{goal_id: goal_id})
    assert {200, _} = mutation(editor, [:kpi_goal_links, :set_link], %{link | linked: false})

    private = %{link | goal_id: Paths.goal_id(ctx.private_goal)}
    assert {200, %{items: items}} = query(editor, [:kpi_goal_links, :search_goals], %{kpi_id: kpi_id, query: ""})
    refute Enum.any?(items, &(&1.id == private.goal_id))
    assert {404, _} = mutation(editor, [:kpi_goal_links, :set_link], private)
    assert {200, _} = mutation(creator, [:kpi_goal_links, :set_link], private)
    assert {200, %{goal: nil, can_link: false}} = query(editor, [:kpi_goal_links, :for_kpi], %{kpi_id: kpi_id})
    assert {404, _} = mutation(editor, [:kpi_goal_links, :set_link], %{private | linked: false})
  end
end
