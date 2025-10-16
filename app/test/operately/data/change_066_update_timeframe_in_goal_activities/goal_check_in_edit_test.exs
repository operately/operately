defmodule Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalCheckInEditTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Activities.Activity

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  describe "Change066UpdateTimeframeInGoalActivities.GoalCheckInEdit" do
    test "updates activities with timeframes", ctx do
      start_date = ~D[2023-01-01]
      end_date = ~D[2023-12-31]

      ctx =
        ctx
        |> Factory.add_goal(:goal, :space,
          timeframe: %{
            type: "year",
            start_date: start_date,
            end_date: end_date
          }
        )
        |> Factory.add_goal_update(:update, :goal, :creator)

      activity =
        %Activity{
          action: "goal_check_in_edit",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "goal_id" => ctx.goal.id,
            "check_in_id" => ctx.update.id,
            "old_timeframe" => %{
              "type" => "year",
              "start_date" => Date.to_iso8601(start_date),
              "end_date" => Date.to_iso8601(end_date)
            },
            "new_timeframe" => %{
              "type" => "quarter",
              "start_date" => Date.to_iso8601(~D[2023-04-01]),
              "end_date" => Date.to_iso8601(~D[2023-06-30])
            }
          }
        }
        |> Repo.insert!()

      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalCheckInEdit.run()

      updated_activity = Repo.reload(activity)

      # Test old timeframe contextual dates
      old_timeframe = updated_activity.content["old_timeframe"]
      assert old_timeframe["contextual_start_date"]["date_type"] == "day"
      assert old_timeframe["contextual_start_date"]["date"] == "2023-01-01"
      assert old_timeframe["contextual_start_date"]["value"] == "Jan 01, 2023"

      assert old_timeframe["contextual_end_date"]["date_type"] == "day"
      assert old_timeframe["contextual_end_date"]["date"] == "2023-12-31"
      assert old_timeframe["contextual_end_date"]["value"] == "Dec 31, 2023"

      # Test new timeframe contextual dates
      new_timeframe = updated_activity.content["new_timeframe"]
      assert new_timeframe["contextual_start_date"]["date_type"] == "day"
      assert new_timeframe["contextual_start_date"]["date"] == "2023-04-01"
      assert new_timeframe["contextual_start_date"]["value"] == "Apr 01, 2023"

      assert new_timeframe["contextual_end_date"]["date_type"] == "day"
      assert new_timeframe["contextual_end_date"]["date"] == "2023-06-30"
      assert new_timeframe["contextual_end_date"]["value"] == "Jun 30, 2023"
    end

    test "handles multiple activities", ctx do
      start_date = ~D[2023-01-01]
      end_date = ~D[2023-12-31]

      ctx =
        ctx
        |> Factory.add_goal(:goal, :space,
          timeframe: %{
            type: "year",
            start_date: start_date,
            end_date: end_date
          }
        )
        |> Factory.add_goal_update(:update, :goal, :creator)

      activity1 =
        %Activity{
          action: "goal_check_in_edit",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "goal_id" => ctx.goal.id,
            "check_in_id" => ctx.update.id,
            "old_timeframe" => %{
              "type" => "year",
              "start_date" => Date.to_iso8601(start_date),
              "end_date" => Date.to_iso8601(end_date)
            },
            "new_timeframe" => %{
              "type" => "quarter",
              "start_date" => Date.to_iso8601(~D[2023-04-01]),
              "end_date" => Date.to_iso8601(~D[2023-06-30])
            }
          }
        }
        |> Repo.insert!()

      activity2 =
        %Activity{
          action: "goal_check_in_edit",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "goal_id" => ctx.goal.id,
            "check_in_id" => ctx.update.id,
            "old_timeframe" => %{
              "type" => "quarter",
              "start_date" => Date.to_iso8601(~D[2023-04-01]),
              "end_date" => Date.to_iso8601(~D[2023-06-30])
            },
            "new_timeframe" => %{
              "type" => "month",
              "start_date" => Date.to_iso8601(~D[2023-07-01]),
              "end_date" => Date.to_iso8601(~D[2023-07-31])
            }
          }
        }
        |> Repo.insert!()

      {:ok, %{success_count: count}} = Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalCheckInEdit.run()
      assert count == 2

      updated_activity1 = Repo.reload(activity1)
      updated_activity2 = Repo.reload(activity2)

      assert updated_activity1.content["old_timeframe"]["contextual_start_date"]["date"] == "2023-01-01"
      assert updated_activity1.content["new_timeframe"]["contextual_start_date"]["date"] == "2023-04-01"

      assert updated_activity2.content["old_timeframe"]["contextual_start_date"]["date"] == "2023-04-01"
      assert updated_activity2.content["new_timeframe"]["contextual_start_date"]["date"] == "2023-07-01"
    end

    test "handles activities with nil timeframes", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:goal, :space)
        |> Factory.add_goal_update(:update, :goal, :creator)

      # Create activity with nil timeframes
      activity =
        %Activity{
          action: "goal_check_in_edit",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "goal_id" => ctx.goal.id,
            "check_in_id" => ctx.update.id
          }
        }
        |> Repo.insert!()

      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalCheckInEdit.run()

      updated_activity = Repo.reload(activity)

      assert updated_activity.content["old_timeframe"] == nil
      assert updated_activity.content["new_timeframe"] == nil
    end
  end
end
