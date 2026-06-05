defmodule Operately.Features.Spaces.OverviewTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.SpacesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "listing existing space", ctx do
    ctx
    |> Steps.given_two_spaces_exists()
    |> Steps.visit_home()
    |> Steps.assert_all_spaces_are_listed()
    |> Steps.assert_privacy_indicator_is_visible()
  end

  feature "viewing space information", ctx do
    ctx
    |> Steps.given_a_space_exists()
    |> Steps.visit_home()
    |> Steps.click_on_space()
    |> Steps.assert_space_name_mission_and_privacy_indicator()
  end

  feature "general space does not show delete option", ctx do
    ctx
    |> Steps.visit_general_space()
    |> Steps.assert_delete_option_not_visible()
  end

  feature "viewing space home excludes paused projects", ctx do
    ctx
    |> Steps.given_a_space_with_active_and_paused_projects()
    |> Steps.visit_space()
    |> Steps.assert_goals_and_projects_box_shows_correct_counts()
    |> Steps.assert_paused_projects_are_not_listed()
  end

  feature "pending projects and goals are not counted as on track", ctx do
    ctx
    |> Steps.given_a_space_with_pending_projects_and_goals()
    |> Steps.visit_space()
    |> Steps.assert_pending_projects_and_goals_counted_correctly()
  end

  feature "listing projects in a space", ctx do
    ctx
    |> Steps.visit_home()
    |> Steps.given_a_space_exists()
    |> Steps.given_the_space_has_several_projects(["Project 1", "Project 2"])
    |> Steps.given_the_space_has_several_space_wide_projects(["Project 3", "Project 4"])
    |> Steps.when_clicking_on_projects_tab()
    |> Steps.assert_projects_are_listed(["Project 1", "Project 2", "Project 3", "Project 4"])
  end

  feature "all goals and projects are completed", ctx do
    ctx
    |> Steps.given_a_space_exists()
    |> Steps.given_a_completed_project_exists()
    |> Steps.given_a_completed_goal_exists()
    |> Steps.visit_space()
    |> Steps.assert_all_goals_and_projects_are_completed_message()
  end

  feature "closed projects are not shown in goals and projects tool", ctx do
    ctx
    |> Steps.given_a_space_exists()
    |> Steps.given_active_and_closed_projects_exist()
    |> Steps.visit_space()
    |> Steps.assert_closed_projects_not_shown_in_goals_and_projects()
    |> Steps.assert_active_projects_shown_in_goals_and_projects()
  end
end
