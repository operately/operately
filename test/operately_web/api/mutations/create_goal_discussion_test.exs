defmodule OperatelyWeb.Api.Mutations.CreateGoalDiscussionTest do
  use OperatelyWeb.TurboCase

  import Operately.GoalsFixtures
  import Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :update_my_profile, %{})
    end
  end

  describe "create_goal_discussion functionality" do
    setup :register_and_log_in_account

    test "it creates a goal discussion", ctx do
      person = ctx.person
      goal = goal_fixture(person, %{space_id: ctx.company.company_space_id})

      assert {200, %{id: id}} = mutation(ctx.conn, :create_goal_discussion, %{
        goal_id: Paths.goal_id(goal),
        title: "Some title",
        message: rich_text("Hello World") |> Jason.encode!()
      })

      activity = Operately.Activities.get_activity!(id) |> Operately.Repo.preload(:comment_thread)

      assert activity.comment_thread_id != nil
      assert activity.comment_thread.title == "Some title"
    end

    test "if goal does not exist, it returns an error", ctx do
      assert mutation(ctx.conn, :create_goal_discussion, %{
        goal_id: "goal-abc-#{Operately.ShortUuid.encode!(Ecto.UUID.generate())}",
        title: "Some title",
        message: rich_text("Hello World") |> Jason.encode!()
      }) == not_found_response()
    end
  end
end 
