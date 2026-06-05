defmodule Operately.Features.Subscriptions.GoalUpdateTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.SubscriptionsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "Goal Update" do
    setup ctx do
      ctx
      |> Factory.add_space_member(:bob, :space)
      |> Factory.add_space_member(:fred, :space)
      |> Factory.add_space_member(:jane, :space)
      |> Factory.add_space_member(:john, :space)
      |> Factory.add_goal(:goal, :space)
      |> UI.login_as(ctx.creator)
    end

    feature "All contributors", ctx do
      ctx
      |> Steps.go_to_goal_check_in_page()
      |> Steps.fill_out_goal_update_form()
      |> Steps.select_all_people()
      |> Steps.submit_goal_update_form()
      |> Steps.assert_current_subscribers(%{count: 5, resource: "check-in"})
    end

    feature "Select specific contributors", ctx do
      ctx
      |> Steps.go_to_goal_check_in_page()
      |> Steps.fill_out_goal_update_form()
      |> Steps.select_specific_people()
      |> Steps.toggle_person_checkbox(ctx.john)
      |> Steps.toggle_person_checkbox(ctx.jane)
      |> Steps.save_people_selection()
      |> Steps.submit_goal_update_form()
      |> Steps.assert_current_subscribers(%{count: 3, resource: "check-in"})
    end

    feature "No one", ctx do
      ctx
      |> Steps.go_to_goal_check_in_page()
      |> Steps.fill_out_goal_update_form()
      |> Steps.select_no_one()
      |> Steps.submit_goal_update_form()
      |> Steps.assert_current_subscribers(%{count: 1, resource: "check-in"})
    end

    feature "Subscribe and unsubribe", ctx do
      ctx
      |> Steps.go_to_goal_check_in_page()
      |> Steps.fill_out_goal_update_form()
      |> Steps.select_all_people()
      |> Steps.submit_goal_update_form()
      |> Steps.exercise_current_subscriptions_widget("check-in")
    end
  end
end
