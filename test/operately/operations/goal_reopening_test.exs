defmodule Operately.Operations.GoalReopeningTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Goals
  alias Operately.Goals.Goal
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id})
    reader = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(author)

    Oban.Testing.with_testing_mode(:manual, fn ->
      goal_fixture(author, %{space_id: group.id, targets: []})
        |> Goal.changeset(%{
          closed_at: DateTime.utc_now(),
          closed_by_id: author.id,
        })
        |> Repo.update()
    end)

    goal = Goals.list_goals() |> hd()

    {:ok, author: author, reader: reader, goal: goal}
  end

  test "GoalReopening operation updates goal", ctx do
    assert ctx.goal.closed_at != nil
    assert ctx.goal.closed_by_id == ctx.author.id

    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.GoalReopening.run(ctx.author, ctx.goal.id, "{}")
    end)

    goal = Repo.reload(ctx.goal)

    assert goal.closed_at == nil
    assert goal.closed_by_id == nil
  end

  test "GoalReopening operation creates activity, thread and notification", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      message = notification_message(ctx.reader)
      Operately.Operations.GoalReopening.run(ctx.author, ctx.goal.id, message)
    end)

    activity = from(a in Activity, where: a.action == "goal_reopening" and a.content["goal_id"] == ^ctx.goal.id) |> Repo.one()

    assert activity.comment_thread_id != nil
    assert 0 == notifications_count()

    perform_job(activity.id)

    assert 1 == notifications_count()
    assert nil != fetch_notification(activity.id)
  end
end
