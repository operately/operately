defmodule Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalEditingTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Activities.Activity

  describe "UpdateGoalEditingActivity" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
    end

    test "adds contextual dates to activity's previous_timeframe and current_timeframe", ctx do
      start_date = ~D[2023-01-01]
      end_date = ~D[2023-12-31]

      new_start_date = ~D[2023-02-01]
      new_end_date = ~D[2023-11-30]

      ctx = Factory.add_goal(ctx, :goal, :space, timeframe: %{type: "year", start_date: start_date, end_date: end_date})

      # Create a goal editing activity with previous and current timeframes
      activity =
        %Activity{
          action: "goal_editing",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "space_id" => ctx.space.id,
            "goal_id" => ctx.goal.id,
            "old_name" => "Old Goal Name",
            "new_name" => "New Goal Name",
            "old_champion_id" => ctx.creator.id,
            "new_champion_id" => ctx.creator.id,
            "old_reviewer_id" => ctx.creator.id,
            "new_reviewer_id" => ctx.creator.id,
            "previous_timeframe" => %{
              "type" => "year",
              "start_date" => start_date,
              "end_date" => end_date
            },
            "current_timeframe" => %{
              "type" => "year",
              "start_date" => new_start_date,
              "end_date" => new_end_date
            }
          }
        }
        |> Repo.insert!()

      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalEditing.run()

      updated_activity = Repo.reload(activity)

      # Test previous timeframe
      previous_timeframe = updated_activity.content["previous_timeframe"]
      assert previous_timeframe["contextual_start_date"]["date_type"] == "day"
      assert previous_timeframe["contextual_start_date"]["value"] == "Jan 01, 2023"
      assert previous_timeframe["contextual_start_date"]["date"] == "2023-01-01"

      assert previous_timeframe["contextual_end_date"]["date_type"] == "day"
      assert previous_timeframe["contextual_end_date"]["value"] == "Dec 31, 2023"
      assert previous_timeframe["contextual_end_date"]["date"] == "2023-12-31"

      # Test current timeframe
      current_timeframe = updated_activity.content["current_timeframe"]
      assert current_timeframe["contextual_start_date"]["date_type"] == "day"
      assert current_timeframe["contextual_start_date"]["value"] == "Feb 01, 2023"
      assert current_timeframe["contextual_start_date"]["date"] == "2023-02-01"

      assert current_timeframe["contextual_end_date"]["date_type"] == "day"
      assert current_timeframe["contextual_end_date"]["value"] == "Nov 30, 2023"
      assert current_timeframe["contextual_end_date"]["date"] == "2023-11-30"
    end

    test "run/0 backfills contextual dates for all goal editing activities", ctx do
      start_date1 = ~D[2023-01-01]
      end_date1 = ~D[2023-12-31]
      start_date2 = ~D[2023-04-01]
      end_date2 = ~D[2023-06-30]

      ctx =
        ctx
        |> Factory.add_goal(:goal1, :space, timeframe: %{type: "year", start_date: start_date1, end_date: end_date1})
        |> Factory.add_goal(:goal2, :space, timeframe: %{type: "quarter", start_date: start_date2, end_date: end_date2})

      # Create two goal editing activities
      activity1 =
        %Activity{
          action: "goal_editing",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "space_id" => ctx.space.id,
            "goal_id" => ctx.goal1.id,
            "old_name" => "Old Goal 1 Name",
            "new_name" => "New Goal 1 Name",
            "old_champion_id" => ctx.creator.id,
            "new_champion_id" => ctx.creator.id,
            "old_reviewer_id" => ctx.creator.id,
            "new_reviewer_id" => ctx.creator.id,
            "previous_timeframe" => %{
              "type" => "year",
              "start_date" => start_date1,
              "end_date" => end_date1
            },
            "current_timeframe" => %{
              "type" => "year",
              "start_date" => start_date1,
              "end_date" => end_date1
            }
          }
        }
        |> Repo.insert!()

      activity2 =
        %Activity{
          action: "goal_editing",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "space_id" => ctx.space.id,
            "goal_id" => ctx.goal2.id,
            "old_name" => "Old Goal 2 Name",
            "new_name" => "New Goal 2 Name",
            "old_champion_id" => ctx.creator.id,
            "new_champion_id" => ctx.creator.id,
            "old_reviewer_id" => ctx.creator.id,
            "new_reviewer_id" => ctx.creator.id,
            "previous_timeframe" => %{
              "type" => "quarter",
              "start_date" => start_date2,
              "end_date" => end_date2
            },
            "current_timeframe" => %{
              "type" => "quarter",
              "start_date" => start_date2,
              "end_date" => end_date2
            }
          }
        }
        |> Repo.insert!()

      {:ok, result} = Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalEditing.run()

      assert result.success_count == 2
      assert result.error_count == 0

      # Check first activity
      updated_activity1 = Repo.reload(activity1)
      prev_timeframe1 = updated_activity1.content["previous_timeframe"]
      assert prev_timeframe1["contextual_start_date"]["date_type"] == "day"
      assert prev_timeframe1["contextual_start_date"]["value"] == "Jan 01, 2023"
      assert prev_timeframe1["contextual_end_date"]["value"] == "Dec 31, 2023"

      curr_timeframe1 = updated_activity1.content["current_timeframe"]
      assert curr_timeframe1["contextual_start_date"]["date_type"] == "day"
      assert curr_timeframe1["contextual_start_date"]["value"] == "Jan 01, 2023"
      assert curr_timeframe1["contextual_end_date"]["value"] == "Dec 31, 2023"

      # Check second activity
      updated_activity2 = Repo.reload(activity2)
      prev_timeframe2 = updated_activity2.content["previous_timeframe"]
      assert prev_timeframe2["contextual_start_date"]["date_type"] == "day"
      assert prev_timeframe2["contextual_start_date"]["value"] == "Apr 01, 2023"
      assert prev_timeframe2["contextual_end_date"]["value"] == "Jun 30, 2023"

      curr_timeframe2 = updated_activity2.content["current_timeframe"]
      assert curr_timeframe2["contextual_start_date"]["date_type"] == "day"
      assert curr_timeframe2["contextual_start_date"]["value"] == "Apr 01, 2023"
      assert curr_timeframe2["contextual_end_date"]["value"] == "Jun 30, 2023"
    end

    test "handles activities with old string timeframe format", ctx do
      start_date = ~D[2023-01-01]
      end_date = ~D[2023-12-31]

      ctx = Factory.add_goal(ctx, :goal, :space, timeframe: %{type: "year", start_date: start_date, end_date: end_date})

      # Create activity with old timeframe format
      activity =
        %Activity{
          action: "goal_editing",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "space_id" => ctx.space.id,
            "goal_id" => ctx.goal.id,
            "old_name" => "Old Goal Name",
            "new_name" => "New Goal Name",
            "old_champion_id" => ctx.creator.id,
            "new_champion_id" => ctx.creator.id,
            "old_reviewer_id" => ctx.creator.id,
            "new_reviewer_id" => ctx.creator.id,
            "old_timeframe" => "2023",
            "new_timeframe" => "Q2 2024"
          }
        }
        |> Repo.insert!()

      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalEditing.run()

      updated_activity = Repo.reload(activity)

      # Test previous timeframe - converted from "2023"
      previous_timeframe = updated_activity.content["previous_timeframe"]
      assert previous_timeframe["contextual_start_date"]["date_type"] == "day"
      assert previous_timeframe["contextual_start_date"]["date"] == "2023-01-01"

      # Test current timeframe - converted from "2023 Q2"
      current_timeframe = updated_activity.content["current_timeframe"]
      assert current_timeframe["contextual_start_date"]["date_type"] == "day"
      assert current_timeframe["contextual_start_date"]["date"] == "2024-04-01"
    end
  end
end
