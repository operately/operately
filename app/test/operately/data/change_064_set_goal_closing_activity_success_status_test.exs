defmodule Operately.Data.Change064SetGoalClosingActivitySuccessStatusTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.GoalsFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> setup_test_activities()
  end

  test "sets success_status for goal_closing activities", ctx do
    Operately.Data.Change064SetGoalClosingActivitySuccessStatus.run()

    achieved_activity = Repo.get(Activity, ctx.achieved_activity.id)
    missed_activity = Repo.get(Activity, ctx.missed_activity.id)
    other_activity = Repo.get(Activity, ctx.other_activity.id)

    assert achieved_activity.content["success_status"] == "achieved"
    assert missed_activity.content["success_status"] == "missed"
    assert other_activity.content["success_status"] == "achieved"
  end

  defp setup_test_activities(ctx) do
    goal = GoalsFixtures.goal_fixture(ctx.creator, %{space_id: ctx.space.id})

    achieved_activity =
      create_activity(ctx.creator, "goal_closing", %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "goal_id" => goal.id,
        "success" => "yes"
      })

    missed_activity =
      create_activity(ctx.creator, "goal_closing", %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "goal_id" => goal.id,
        "success" => "no"
      })

    other_activity =
      create_activity(ctx.creator, "goal_closing", %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "goal_id" => goal.id,
        "goal_name" => "Test Goal"
      })

    ctx
    |> Map.put(:achieved_activity, achieved_activity)
    |> Map.put(:missed_activity, missed_activity)
    |> Map.put(:other_activity, other_activity)
  end

  defp create_activity(author, action, content) do
    {:ok, result} =
      Ecto.Multi.new()
      |> Ecto.Multi.insert(
        :activity,
        Activity.changeset(%{
          author_id: author.id,
          action: action,
          content: content
        })
      )
      |> Repo.transaction()

    result.activity
  end
end
