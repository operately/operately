defmodule Operately.Features.GlobalSearch.FilteringAndContextTest do
  use Operately.FeatureCase
  use Operately.Support.Features.GlobalSearchCase

  feature "search filters out done milestones", ctx do
    ctx
    |> Steps.given_done_milestone_exists("Completed Milestone")
    |> Steps.open_global_search()
    |> Steps.search_for("Completed")
    |> Steps.refute_milestone_result_visible("Completed Milestone")
  end

  feature "search filters out closed project milestones", ctx do
    ctx
    |> Steps.given_closed_project_with_milestone_exists()
    |> Steps.open_global_search()
    |> Steps.search_for("Closed")
    |> Steps.refute_milestone_result_visible("Closed Project Milestone")
  end

  feature "search shows project and space context for milestones", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("Launch")
    |> Steps.assert_milestone_result_visible("Launch Milestone")
    |> Steps.assert_milestone_shows_project_context("Website Redesign")
    |> Steps.assert_milestone_shows_space_context("Marketing")
  end

  feature "search shows champion and space context for goals", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("Support")
    |> Steps.assert_goal_result_visible("Improve support response time")
    |> Steps.assert_goal_shows_champion_context("John Champion")
    |> Steps.assert_goal_shows_space_context("Product")
  end

  feature "search shows project and space context for tasks", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("Design")
    |> Steps.assert_task_result_visible("Design homepage")
    |> Steps.assert_task_shows_project_context("Website Redesign")
    |> Steps.assert_task_shows_space_context("Marketing")
  end

  feature "mixed results show all categories", ctx do
    ctx
    |> Steps.given_all_resource_types_exist()
    |> Steps.open_global_search()
    |> Steps.search_for("Test")
    |> Steps.assert_category_header_visible("SPACES")
    |> Steps.assert_category_header_visible("GOALS")
    |> Steps.assert_category_header_visible("PROJECTS")
    |> Steps.assert_category_header_visible("MILESTONES")
    |> Steps.assert_category_header_visible("TASKS")
    |> Steps.assert_category_header_visible("PEOPLE")
  end
end
