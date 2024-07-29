defmodule Operately.Operations.GoalEditingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Goals
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)

    goal = goal_fixture(creator, %{
      name: "some name",
      space_id: space.id,
      champion_id: creator.id,
      reviewer_id: creator.id,
      targets: [
        %{
          name: "Some target",
          from: 80,
          to: 90,
          unit: "percent",
          index: 0
        }
      ],
    })

    attrs = %{
      name: "new name",
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      timeframe: %{ type: "days", start_date: Date.utc_today(), end_date: Date.add(Date.utc_today(), 2) },
      added_targets: [ %{ name: "new target", from: 30, to: 15, unit: "minutes", index: 1 } ],
      updated_targets: [],
      company_access_level: Binding.view_access(),
      space_access_level: Binding.comment_access(),
      anonymous_access_level: Binding.no_access(),
    }

    {:ok, attrs: attrs, company: company, space: space, goal: goal, creator: creator, champion: champion, reviewer: reviewer}
  end

  test "GoalEditing operation updates goal", ctx do
    assert ctx.goal.name == "some name"
    assert ctx.goal.champion_id == ctx.creator.id
    assert ctx.goal.reviewer_id == ctx.creator.id

    targets = Goals.list_targets(ctx.goal.id)
    target = hd(targets)

    assert length(targets) == 1
    assert target.name == "Some target"

    attrs = Map.merge(ctx.attrs, %{updated_targets: [ %{ id: target.id, name: "updated target" } ]})

    {:ok, goal} = Operately.Operations.GoalEditing.run(ctx.creator, ctx.goal, attrs)

    target = Repo.reload(target)

    assert goal.name == "new name"
    assert goal.champion_id == ctx.champion.id
    assert goal.reviewer_id == ctx.reviewer.id
    assert length(Goals.list_targets(goal.id)) == 2
    assert target.name == "updated target"
  end

  test "GoalEditing operation updates goal's bindings to company", ctx do
    context = Access.get_context!(goal_id: ctx.goal.id)
    standard = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    anonymous = Access.get_group!(company_id: ctx.company.id, tag: :anonymous)

    assert Access.get_binding(context_id: context.id, group_id: standard.id, access_level: Binding.comment_access())
    assert Access.get_binding(context_id: context.id, group_id: anonymous.id, access_level: Binding.view_access())

    Operately.Operations.GoalEditing.run(ctx.creator, ctx.goal, ctx.attrs)

    refute Access.get_binding(context_id: context.id, group_id: standard.id, access_level: Binding.comment_access())
    refute Access.get_binding(context_id: context.id, group_id: anonymous.id, access_level: Binding.view_access())

    assert Access.get_binding(context_id: context.id, group_id: standard.id, access_level: Binding.view_access())
    assert Access.get_binding(context_id: context.id, group_id: anonymous.id, access_level: Binding.no_access())
  end

  test "GoalEditing operation updates goal's bindings to space", ctx do
    context = Access.get_context!(goal_id: ctx.goal.id)
    standard = Access.get_group!(group_id: ctx.space.id, tag: :standard)

    assert Access.get_binding(context_id: context.id, group_id: standard.id, access_level: Binding.edit_access())

    Operately.Operations.GoalEditing.run(ctx.creator, ctx.goal, ctx.attrs)

    refute Access.get_binding(context_id: context.id, group_id: standard.id, access_level: Binding.edit_access())
    assert Access.get_binding(context_id: context.id, group_id: standard.id, access_level: Binding.comment_access())
  end

  test "GoalEditing operation updates goal's bindings to champion and reviewer with tags", ctx do
    context = Access.get_context!(goal_id: ctx.goal.id)

    # New reviewer and champion have no bindings to goal
    champion_group = Access.get_group!(person_id: ctx.champion.id)
    reviewer_group = Access.get_group!(person_id: ctx.reviewer.id)

    refute Access.get_binding(context_id: context.id, group_id: champion_group.id)
    refute Access.get_binding(context_id: context.id, group_id: reviewer_group.id)

    # Bindings to goal are successfully created and deleted
    creator_group = Access.get_group!(person_id: ctx.creator.id)

    Operately.Operations.GoalEditing.run(ctx.creator, ctx.goal, ctx.attrs)

    assert Access.get_binding(context_id: context.id, group_id: champion_group.id)
    assert Access.get_binding(tag: :champion, context_id: context.id, group_id: champion_group.id, access_level: Binding.full_access())

    assert Access.get_binding(context_id: context.id, group_id: reviewer_group.id)
    assert Access.get_binding(tag: :reviewer, context_id: context.id, group_id: reviewer_group.id, access_level: Binding.full_access())

    refute Access.get_binding(context_id: context.id, group_id: creator_group.id)

    # A person can have reviewer and champion bindings with the right tags
    goal = Repo.reload(ctx.goal)
    attrs = Map.merge(ctx.attrs, %{ reviewer_id: ctx.champion.id })

    Operately.Operations.GoalEditing.run(ctx.creator, goal, attrs)

    assert_raise Ecto.MultipleResultsError, ~r/^expected at most one result but got 2 in query:/, fn ->
      Access.get_binding(context_id: context.id, group_id: champion_group.id)
    end
    assert Access.get_binding(tag: :champion, context_id: context.id, group_id: champion_group.id, access_level: Binding.full_access())
    assert Access.get_binding(tag: :reviewer, context_id: context.id, group_id: champion_group.id, access_level: Binding.full_access())

    refute Access.get_binding(context_id: context.id, group_id: reviewer_group.id)
  end

  test "GoalEditing operation creates activity and notification", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.GoalEditing.run(ctx.creator, ctx.goal, ctx.attrs)
    end)

    activity = from(a in Activity, where: a.action == "goal_editing" and a.content["goal_id"] == ^ctx.goal.id) |> Repo.one()

    assert activity
    assert 0 == notifications_count()

    perform_job(activity.id)

    assert 2 == notifications_count() # 1 reviewer + 1 champion = 2
    assert fetch_notifications(activity.id)
  end
end
