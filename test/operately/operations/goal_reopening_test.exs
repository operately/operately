defmodule Operately.Operations.GoalReopeningTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(author)

    {:ok, goal} = goal_fixture(author, %{space_id: group.id, targets: []})
      |> Goal.changeset(%{
        closed_at: DateTime.utc_now(),
        closed_by_id: author.id,
      })
      |> Repo.update()

    {:ok, author: author, goal: goal}
  end

  test "GoalReopening operation updates goal", ctx do
    assert ctx.goal.closed_at != nil
    assert ctx.goal.closed_by_id == ctx.author.id

    Operately.Operations.GoalReopening.run(ctx.author, ctx.goal.id, "{}")

    goal = Repo.reload(ctx.goal)

    assert goal.closed_at == nil
    assert goal.closed_by_id == nil
  end

  test "GoalReopening operation creates activity and thread", ctx do
    Operately.Operations.GoalReopening.run(ctx.author, ctx.goal.id, "{}")

    activity = from(a in Activity, where: a.action == "goal_reopening" and a.content["goal_id"] == ^ctx.goal.id) |> Repo.one()

    assert activity.comment_thread_id != nil
  end
end
