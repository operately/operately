defmodule Operately.Operations.GoalClosingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Goals
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(author)

    Oban.Testing.with_testing_mode(:manual, fn ->
      goal_fixture(author, %{space_id: group.id, champion_id: champion.id, targets: []})
    end)

    goal = Goals.list_goals() |> hd()

    {:ok, author: author, goal: goal}
  end

  test "GoalClosing operation updates goal", ctx do
    assert ctx.goal.closed_at == nil
    assert ctx.goal.closed_by_id == nil

    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.GoalClosing.run(ctx.author, ctx.goal.id, "success", "{}")
    end)

    goal = Repo.reload(ctx.goal)

    assert goal.closed_at != nil
    assert goal.closed_by_id == ctx.author.id
  end

  test "GoalClosing operation creates activity, thread and notification", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.GoalClosing.run(ctx.author, ctx.goal.id, "success", "{}")
    end)

    activity = from(a in Activity, where: a.action == "goal_closing" and a.content["goal_id"] == ^ctx.goal.id) |> Repo.one()

    assert activity.comment_thread_id != nil

    assert 0 == notifications_count()

    perform_job(activity.id)

    assert 1 == notifications_count()

    assert nil != fetch_notification(activity.id)
  end
end
