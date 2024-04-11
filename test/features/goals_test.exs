defmodule Operately.Features.GoalTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GoalSteps, as: Steps

  setup ctx do
    ctx = Steps.create_goal(ctx)
    ctx = UI.login_based_on_tag(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "archive goal", ctx do
    ctx
    |> Steps.visit_page()
    |> Steps.archive_goal()
    |> Steps.assert_goal_archived()
    |> Steps.assert_goal_archived_email_sent()
    |> Steps.assert_goal_archived_feed_posted()
  end

  @tag login_as: :champion
  feature "editing goals", ctx do
    ctx
    |> Steps.visit_page()
    |> Steps.edit_goal()
    |> Steps.assert_goal_edited()
    |> Steps.assert_goal_edited_email_sent()
    |> Steps.assert_goal_edited_feed_posted()
  end

  @parent_goal_params %{
    name: "Reduce first response time for support tickets",
    target_name: "First response time",
    from: "30",
    to: "15",
    unit: "minutes",
  }

  @tag login_as: :champion
  feature "changing goal parent", ctx do
    ctx
    |> Steps.visit_page()
    |> Steps.assert_goal_is_company_wide()
    |> Steps.given_a_goal_exists(@parent_goal_params)
    |> Steps.change_goal_parent(@parent_goal_params.name)
    |> Steps.assert_goal_parent_changed(@parent_goal_params.name)
  end

  @tag login_as: :champion
  feature "closing goal", ctx do
    ctx
    |> Steps.visit_page()
    |> Steps.close_goal()
    |> Steps.assert_goal_closed()
    |> Steps.assert_goal_is_not_editable()
    |> Steps.assert_goal_closed_email_sent()
    |> Steps.assert_goal_closed_feed_posted()
    |> Steps.assert_goal_closed_notification_sent()
  end
  
end
