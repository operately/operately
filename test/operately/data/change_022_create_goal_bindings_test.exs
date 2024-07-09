defmodule Operately.Data.Change022CreateGoalBindingsTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Repo
  alias Operately.Access

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(creator)

    attrs = %{space_id: group.id, champion_id: champion.id, reviewer_id: reviewer.id}

    goals_with_bindings = Enum.map(1..3, fn _ ->
      goal_fixture(creator, attrs)
    end)

    goals_without_bindings = Enum.map(1..3, fn _ ->
      create_goal(creator, attrs)
    end)

    {:ok, company: company, group: group, champion: champion, reviewer: reviewer, goals_with_bindings: goals_with_bindings, goals_without_bindings: goals_without_bindings}
  end

  test "creates access bindings between goals and companies", ctx do
    full_access = Access.get_group!(company_id: ctx.company.id, tag: :full_access)
    standard = Access.get_group!(company_id: ctx.company.id, tag: :standard)

    assert_bindings(ctx.goals_with_bindings, full_access)
    assert_bindings(ctx.goals_with_bindings, standard)

    refute_bindings(ctx.goals_without_bindings, full_access)
    refute_bindings(ctx.goals_without_bindings, standard)

    Operately.Data.Change022CreateGoalBindings.run()

    goals = ctx.goals_with_bindings ++ ctx.goals_without_bindings

    assert_bindings(goals, full_access)
    assert_bindings(goals, standard)
  end

  test "creates access bindings between goals and spaces", ctx do
    full_access = Access.get_group!(group_id: ctx.group.id, tag: :full_access)
    standard = Access.get_group!(group_id: ctx.group.id, tag: :standard)

    assert_bindings(ctx.goals_with_bindings, full_access)
    assert_bindings(ctx.goals_with_bindings, standard)

    refute_bindings(ctx.goals_without_bindings, full_access)
    refute_bindings(ctx.goals_without_bindings, standard)

    Operately.Data.Change022CreateGoalBindings.run()

    goals = ctx.goals_with_bindings ++ ctx.goals_without_bindings

    assert_bindings(goals, full_access)
    assert_bindings(goals, standard)
  end

  test "creates access bindings between goals and champions and reviewers", ctx do
    reviewer = Access.get_group!(person_id: ctx.reviewer.id)
    champion = Access.get_group!(person_id: ctx.champion.id)

    assert_bindings(ctx.goals_with_bindings, reviewer)
    assert_bindings(ctx.goals_with_bindings, champion)

    refute_bindings(ctx.goals_without_bindings, reviewer)
    refute_bindings(ctx.goals_without_bindings, champion)

    Operately.Data.Change022CreateGoalBindings.run()

    goals = ctx.goals_with_bindings ++ ctx.goals_without_bindings

    assert_bindings(goals, reviewer)
    assert_bindings(goals, champion)
  end

  #
  # Helpers
  #

  defp assert_bindings(goals, group) do
    Enum.each(goals, fn goal ->
      context = Access.get_context!(goal_id: goal.id)

      assert Access.get_binding(context_id: context.id, group_id: group.id)
    end)
  end

  defp refute_bindings(goals, group) do
    Enum.each(goals, fn goal ->
      context = Access.get_context!(goal_id: goal.id)

      refute Access.get_binding(context_id: context.id, group_id: group.id)
    end)
  end

  defp create_goal(creator, attrs) do
    {:ok, goal} = Map.merge(%{
        name: "some name",
        company_id: creator.company_id,
        group_id: attrs.space_id,
        champion_id: attrs.champion_id,
        reviewer_id: attrs.reviewer_id,
        creator_id: creator.id,
      }, attrs)
      |> Operately.Goals.Goal.changeset()
      |> Repo.insert()

    Access.create_context(%{goal_id: goal.id})

    goal
  end
end
