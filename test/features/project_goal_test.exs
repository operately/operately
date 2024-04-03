defmodule Operately.Features.ProjectGoalTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.create_project(name: "Test Project")
    |> Steps.given_a_goal_exists(name: "Improve support first response time")
    |> Steps.login()
  end

  @tag login_as: :champion
  feature "connect a goal to a project", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.choose_new_goal(goal_name: "Improve support first response time")
    |> Steps.assert_goal_connected(goal_name: "Improve support first response time")
    |> Steps.assert_goal_link_on_project_page(goal_name: "Improve support first response time")
    |> Steps.assert_goal_connected_email_sent_to_champion(goal_name: "Improve support first response time")
  end

  @tag login_as: :champion
  feature "disconnect a goal from a project", ctx do
    ctx
    |> Steps.given_the_goal_is_connected_with_project()
    |> Steps.visit_project_page()
    |> Steps.assert_goal_connected(goal_name: ctx.goal.name)
    |> Steps.disconnect_goal()
    |> Steps.assert_goal_link_not_on_project_page()
    |> Steps.assert_goal_disconnected_email_sent_to_champion(goal_name: ctx.goal.name)
    |> Steps.assert_goal_disconnected_notification_sent_to_reviewer()
  end
end
