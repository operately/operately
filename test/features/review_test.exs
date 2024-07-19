defmodule Operately.Features.ReviewTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ReviewSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "check in projects and acknowledge project check-ins", ctx do
    project_attrs = %{ today: "today", due: "3 days ago" }
    check_in_name = "another project"

    ctx
    |> Steps.setup_projects(project_attrs)
    |> Steps.setup_check_ins(check_in_name)
    |> Steps.visit_review_page()
    |> Steps.assert_title(4)
    |> Steps.assert_navbar_count(4)
    |> Steps.check_in_project(project_attrs.due)
    |> Steps.assert_navbar_count(3)
    |> Steps.visit_review_page()
    |> Steps.assert_title(3)
    |> Steps.acknowledge_check_in(check_in_name)
    |> Steps.assert_navbar_count(2)
    |> Steps.visit_review_page()
    |> Steps.assert_title(2)
  end

  feature "update goals and acknowledge goal check-ins", ctx do
    goal_attrs = %{ today: "today", due: "3 days ago" }
    update_name = "another goal"

    ctx
    |> Steps.setup_goals(goal_attrs)
    |> Steps.setup_updates(update_name)
    |> Steps.visit_review_page()
    |> Steps.assert_title(4)
    |> Steps.assert_navbar_count(4)
    |> Steps.check_in_goal(goal_attrs.due)
    |> Steps.assert_navbar_count(3)
    |> Steps.visit_review_page()
    |> Steps.assert_title(3)
    |> Steps.acknowledge_goal_check_in(update_name)
    |> Steps.assert_navbar_count(2)
    |> Steps.visit_review_page()
    |> Steps.assert_title(2)
  end

  feature "empty review page", ctx do
    ctx
    |> Steps.visit_review_page()
    |> UI.assert_text("Review")
    |> UI.assert_text("Your due actions as a champion and/or reviewer will appear here.")
    |> UI.refute_has(testid: "review-link-count")
  end
end
