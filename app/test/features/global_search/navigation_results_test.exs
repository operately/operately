defmodule Operately.Features.GlobalSearch.NavigationResultsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.GlobalSearchSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "searching for spaces", ctx do
    ctx
    |> Steps.open_global_search()
    |> Steps.search_for("Product")
    |> Steps.assert_space_result_visible("Product")
    |> Steps.click_space_result("Product")
    |> Steps.assert_navigated_to_space("Product")
  end

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
end
