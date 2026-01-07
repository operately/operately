defmodule Operately.Features.GlobalSearchTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GlobalSearchSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "searching for projects", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("Website")
    |> Steps.assert_project_result_visible("Website Redesign")
    |> Steps.click_project_result("Website Redesign")
    |> Steps.assert_navigated_to_project("Website Redesign")
  end

  feature "searching for goals", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("Support")
    |> Steps.assert_goal_result_visible("Improve support response time")
    |> Steps.click_goal_result("Improve support response time")
    |> Steps.assert_navigated_to_goal("Improve support response time")
  end

  feature "searching for milestones", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("Launch")
    |> Steps.assert_milestone_result_visible("Launch Milestone")
    |> Steps.click_milestone_result("Launch Milestone")
    |> Steps.assert_navigated_to_milestone()
  end

  feature "searching for tasks", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("Design")
    |> Steps.assert_task_result_visible("Design homepage")
    |> Steps.click_task_result("Design homepage")
    |> Steps.assert_navigated_to_task()
  end

  feature "searching for space tasks", ctx do
    task_name = "Update Marketing Strategy"

    ctx
    |> Steps.given_space_task_exists(task_name)
    |> Steps.open_global_search()
    |> Steps.search_for("Strategy")
    |> Steps.assert_task_result_visible(task_name)
    |> Steps.click_task_result(task_name)
    |> Steps.assert_navigated_to_space_kanban_with_task(task_name)
  end

  feature "searching for people", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("Alice")
    |> Steps.assert_person_result_visible("Alice Smith")
    |> Steps.click_person_result("Alice Smith")
    |> Steps.assert_navigated_to_person("Alice Smith")
  end

  feature "no results found", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("NonexistentItem")
    |> Steps.assert_no_results_message()
  end

  feature "search requires minimum 2 characters", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("A")
    |> Steps.assert_search_not_triggered()
  end

  feature "close search with escape key", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("test")
    |> Steps.press_escape()
    |> Steps.assert_search_closed()
  end

  feature "close search by clicking outside", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("test")
    |> Steps.click_outside_search()
    |> Steps.assert_search_closed()
  end

  feature "search shows loading state", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.start_typing("Website")
    |> Steps.assert_searching_indicator()
  end

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
    |> Steps.assert_category_header_visible("GOALS")
    |> Steps.assert_category_header_visible("PROJECTS")
    |> Steps.assert_category_header_visible("MILESTONES")
    |> Steps.assert_category_header_visible("TASKS")
    |> Steps.assert_category_header_visible("PEOPLE")
  end
end
