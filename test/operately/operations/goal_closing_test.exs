defmodule Operately.Operations.GoalClosingTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(author)
    goal = goal_fixture(author, %{space_id: group.id, targets: []})

    {:ok, author: author, goal: goal}
  end

  test "GoalClosing operation updates goal", ctx do
    assert ctx.goal.closed_at == nil
    assert ctx.goal.closed_by_id == nil

    Operately.Operations.GoalClosing.run(ctx.author, ctx.goal.id, "success", "{}")

    goal = Repo.reload(ctx.goal)

    assert goal.closed_at != nil
    assert goal.closed_by_id == ctx.author.id
  end

  test "GoalClosing operation creates activity and thread", ctx do
    Operately.Operations.GoalClosing.run(ctx.author, ctx.goal.id, "success", "{}")

    activity = from(a in Activity, where: a.action == "goal_closing" and a.content["goal_id"] == ^ctx.goal.id) |> Repo.one()

    assert activity.comment_thread_id != nil
  end
end
