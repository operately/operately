defmodule Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalTimeframeEditingTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Activities.Activity

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
  end

  describe "Change066UpdateTimeframeInGoalActivities.GoalTimeframeEditing" do
    test "updates activities with both old and new timeframes", ctx do
      activity =
        %Activity{
          action: "goal_timeframe_editing",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "space_id" => ctx.space.id,
            "goal_id" => Ecto.UUID.generate(),
            "goal_name" => "Test Goal",
            "old_timeframe" => %{
              "type" => "year",
              "start_date" => Date.to_iso8601(~D[2023-01-01]),
              "end_date" => Date.to_iso8601(~D[2023-12-31])
            },
            "new_timeframe" => %{
              "type" => "quarter",
              "start_date" => Date.to_iso8601(~D[2023-04-01]),
              "end_date" => Date.to_iso8601(~D[2023-06-30])
            }
          }
        }
        |> Repo.insert!()

      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalTimeframeEditing.run()

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
      activity1 =
        %Activity{
          action: "goal_timeframe_editing",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "space_id" => ctx.space.id,
            "goal_id" => Ecto.UUID.generate(),
            "goal_name" => "First Goal",
            "old_timeframe" => %{
              "type" => "year",
              "start_date" => Date.to_iso8601(~D[2023-01-01]),
              "end_date" => Date.to_iso8601(~D[2023-12-31])
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
          action: "goal_timeframe_editing",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "space_id" => ctx.space.id,
            "goal_id" => Ecto.UUID.generate(),
            "goal_name" => "Second Goal",
            "old_timeframe" => %{
              "type" => "quarter",
              "start_date" => Date.to_iso8601(~D[2023-01-01]),
              "end_date" => Date.to_iso8601(~D[2023-03-31])
            },
            "new_timeframe" => %{
              "type" => "month",
              "start_date" => Date.to_iso8601(~D[2023-05-01]),
              "end_date" => Date.to_iso8601(~D[2023-05-31])
            }
          }
        }
        |> Repo.insert!()

      {:ok, %{success_count: count}} = Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalTimeframeEditing.run()
      assert count == 2

      updated_activity1 = Repo.reload(activity1)
      updated_activity2 = Repo.reload(activity2)

      assert updated_activity1.content["old_timeframe"]["contextual_start_date"]["date"] == "2023-01-01"
      assert updated_activity1.content["old_timeframe"]["contextual_end_date"]["date"] == "2023-12-31"
      assert updated_activity1.content["new_timeframe"]["contextual_start_date"]["date"] == "2023-04-01"
      assert updated_activity1.content["new_timeframe"]["contextual_end_date"]["date"] == "2023-06-30"

      assert updated_activity2.content["old_timeframe"]["contextual_start_date"]["date"] == "2023-01-01"
      assert updated_activity2.content["old_timeframe"]["contextual_end_date"]["date"] == "2023-03-31"
      assert updated_activity2.content["new_timeframe"]["contextual_start_date"]["date"] == "2023-05-01"
      assert updated_activity2.content["new_timeframe"]["contextual_end_date"]["date"] == "2023-05-31"
    end

    test "handles activity with nil old timeframe", ctx do
      activity =
        %Activity{
          action: "goal_timeframe_editing",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "space_id" => ctx.space.id,
            "goal_id" => Ecto.UUID.generate(),
            "goal_name" => "Test Goal",
            # No old_timeframe
            "new_timeframe" => %{
              "type" => "quarter",
              "start_date" => Date.to_iso8601(~D[2023-04-01]),
              "end_date" => Date.to_iso8601(~D[2023-06-30])
            }
          }
        }
        |> Repo.insert!()

      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalTimeframeEditing.run()

      updated_activity = Repo.reload(activity)

      assert updated_activity.content["old_timeframe"] == nil

      # New timeframe should still be updated
      new_timeframe = updated_activity.content["new_timeframe"]
      assert new_timeframe["contextual_start_date"]["date"] == "2023-04-01"
      assert new_timeframe["contextual_end_date"]["date"] == "2023-06-30"
    end

    test "handles activity with nil new timeframe", ctx do
      activity =
        %Activity{
          action: "goal_timeframe_editing",
          author_id: ctx.creator.id,
          content: %{
            "company_id" => ctx.company.id,
            "space_id" => ctx.space.id,
            "goal_id" => Ecto.UUID.generate(),
            "goal_name" => "Test Goal",
            "old_timeframe" => %{
              "type" => "year",
              "start_date" => Date.to_iso8601(~D[2023-01-01]),
              "end_date" => Date.to_iso8601(~D[2023-12-31])
            }
            # No new_timeframe
          }
        }
        |> Repo.insert!()

      Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalTimeframeEditing.run()

      updated_activity = Repo.reload(activity)

      # Old timeframe should still be updated
      old_timeframe = updated_activity.content["old_timeframe"]
      assert old_timeframe["contextual_start_date"]["date"] == "2023-01-01"
      assert old_timeframe["contextual_end_date"]["date"] == "2023-12-31"

      assert updated_activity.content["new_timeframe"] == nil
    end
  end
end
