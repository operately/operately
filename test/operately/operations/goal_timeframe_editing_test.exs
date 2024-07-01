defmodule Operately.Operations.GoalTimeframeEditingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

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
    reader = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(author)
    goal = goal_fixture(author, %{space_id: group.id, targets: []})

    {:ok, author: author, reader: reader, goal: goal}
  end

  test "GoalTimeframeEditing operation updates goal", ctx do
    assert ctx.goal.timeframe.type == "quarter"

    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.GoalTimeframeEditing.run(
        ctx.author,
        %{
          id: ctx.goal.id,
          timeframe: %{ type: "days", start_date: ~D[2024-04-15], end_date: ~D[2024-08-30]},
          comment: "{}"
        }
      )
    end)

    goal = Repo.reload(ctx.goal)

    assert goal.timeframe.type == "days"
    assert goal.timeframe.start_date == ~D[2024-04-15]
    assert goal.timeframe.end_date == ~D[2024-08-30]
  end

  test "GoalTimeframeEditing operation creates activity and thread", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.GoalTimeframeEditing.run(
        ctx.author,
        %{
          id: ctx.goal.id,
          timeframe: %{type: "days", start_date: Date.utc_today(), end_date: Date.add(Date.utc_today(), 5)},
          comment: notification_message(ctx.reader)
        }
      )
    end)

    activity = from(a in Activity, where: a.action == "goal_timeframe_editing" and a.content["goal_id"] == ^ctx.goal.id) |> Repo.one()

    assert activity.comment_thread_id != nil
    assert 0 == notifications_count()

    perform_job(activity.id)

    assert 1 == notifications_count()
    assert nil != fetch_notification(activity.id)
  end
end
