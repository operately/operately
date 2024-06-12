defmodule Operately.Data.Change012CreateGoalsAccessContextTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Repo
  alias Operately.Access.Context
  alias Operately.Data.Change012CreateGoalsAccessContext

  setup do
    company = company_fixture()
    person = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(person)

    {:ok, person: person, group: group}
  end

  test "creates access_context for existing goals", ctx do
    goals = Enum.map(1..5, fn _ ->
      goal_fixture(ctx.person, %{space_id: ctx.group.id, targets: []})
    end)

    Enum.each(goals, fn goal ->
      assert nil == Repo.get_by(Context, goal_id: goal.id)
    end)

    Change012CreateGoalsAccessContext.run()

    Enum.each(goals, fn goal ->
      assert %Context{} = Repo.get_by(Context, goal_id: goal.id)
    end)
  end
end
