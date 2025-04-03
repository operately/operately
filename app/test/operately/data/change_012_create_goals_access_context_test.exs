defmodule Operately.Data.Change012CreateGoalsAccessContextTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 1]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Goals.Goal
  alias Operately.Access.Context
  alias Operately.Data.Change012CreateGoalsAccessContext

  setup do
    company = company_fixture()
    person = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(person)

    {:ok, company: company, person: person, group: group}
  end

  test "creates access_context for existing goals", ctx do
    goals = Enum.map(1..5, fn _ ->
      create_goal(ctx.company.id, ctx.group.id, ctx.person.id)
    end)

    Enum.each(goals, fn goal ->
      assert nil == Repo.get_by(Context, goal_id: goal.id)
    end)

    Change012CreateGoalsAccessContext.run()

    Enum.each(goals, fn goal ->
      assert %Context{} = Repo.get_by(Context, goal_id: goal.id)
    end)
  end

  test "creates access_context successfully when a goal already has access context", ctx do
    goal_with_context = goal_fixture(ctx.person, %{space_id: ctx.group.id, targets: []})
    goal_without_context = create_goal(ctx.company.id, ctx.group.id, ctx.person.id)

    assert nil != Access.get_context!(goal_id: goal_with_context.id)

    Change012CreateGoalsAccessContext.run()

    assert nil != Access.get_context!(goal_id: goal_without_context.id)
  end

  test "creates access_context for soft-deleted goals", ctx do
    create_goal(ctx.company.id, ctx.group.id, ctx.person.id)
    |> Repo.soft_delete()

    create_goal(ctx.company.id, ctx.group.id, ctx.person.id)

    Change012CreateGoalsAccessContext.run()

    goals = from(p in Goal) |> Repo.all(with_deleted: true)

    assert 2 == length(goals)

    Enum.each(goals, fn goal ->
      assert nil != Access.get_context!(goal_id: goal.id)
    end)
  end

  def create_goal(company_id, group_id, person_id) do
    {:ok, goal} = Goal.changeset(%{
      company_id: company_id,
      name: "some name",
      group_id: group_id,
      champion_id: person_id,
      reviewer_id: person_id,
      creator_id: person_id,
    })
    |> Repo.insert()

    goal
  end
end
