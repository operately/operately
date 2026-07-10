defmodule Operately.Features.Projects.ProjectPageGoalAndExportTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.create_project(name: "Test Project")
    |> Steps.setup_contributors()
    |> Steps.login()
  end

  @tag login_as: :contributor
  feature "connect a goal to a project", ctx do
    goal_name = "Improve support first response time"

    ctx
    |> Steps.given_a_goal_exists(name: goal_name)
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.choose_new_goal(goal_name: goal_name)
    |> Steps.assert_goal_connected(goal_name: goal_name)
    |> Steps.assert_goal_link_on_project_page(goal_name: goal_name)
    |> Steps.assert_project_goal_connection_visible_on_feed(goal_name: goal_name)
    |> Steps.assert_goal_connected_email_sent_to_champion(goal_name: goal_name)
  end

  @tag login_as: :viewer
  feature "export project as markdown", ctx do
    ctx
    |> Steps.assert_logged_in_contributor_has_view_access()
    |> Steps.visit_project_page()
    |> Steps.download_project_markdown()
    |> Steps.assert_project_markdown_includes_details()
  end
end
