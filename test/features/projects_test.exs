defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

  setup ctx do
    ctx = Steps.create_project(ctx, name: "Test Project")
    ctx = Steps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "rename a project", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.rename_project(new_name: "New Name")
    |> Steps.assert_project_renamed(new_name: "New Name")
  end

  @tag login_as: :champion
  feature "move project to a different space", ctx do
    ctx
    |> Steps.given_a_space_exists(%{name: "New Space"})
    |> Steps.visit_project_page()
    |> Steps.move_project_to_new_space()
    |> Steps.assert_project_moved_notification_sent()
    |> Steps.assert_project_moved_feed_item_exists()
  end

  @tag login_as: :champion
  feature "pausing a project", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.pause_project()
    |> Steps.assert_project_paused()
    |> Steps.assert_pause_notification_sent_to_reviewer()
    |> Steps.assert_pause_visible_on_feed()
    |> Steps.assert_pause_email_sent_to_reviewer()
  end

  @tag login_as: :champion
  feature "resuming a project", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.pause_project()
    |> Steps.assert_project_paused()
    |> Steps.resume_project()
    |> Steps.assert_project_active()
    |> Steps.assert_resume_notification_sent_to_reviewer()
    |> Steps.assert_project_resumed_visible_on_feed()
    |> Steps.assert_resume_email_sent_to_reviewer()
  end

  @tag login_as: :champion
  feature "connect a goal to a project", ctx do
    ctx
    |> Steps.given_a_goal_exists(name: "Improve support first response time")
    |> Steps.visit_project_page()
    |> Steps.choose_new_goal(goal_name: "Improve support first response time")
    |> Steps.assert_goal_connected(goal_name: "Improve support first response time")
    |> Steps.assert_goal_link_on_project_page(goal_name: "Improve support first response time")
    |> Steps.assert_goal_connected_email_sent_to_champion(goal_name: "Improve support first response time")
  end

end
