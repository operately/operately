defmodule Operately.Features.ProjectMilestonesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectMilestonesSteps, as: Steps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Live support")
    ctx = UI.login_as(ctx, ctx.champion)

    {:ok, ctx}
  end

  feature "project milestones zero state", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.assert_project_milestones_zero_state()
  end

  feature "add first milestone", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.add_first_milestone(name: "My milestone")
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: "My milestone")
  end

  feature "add milestones to project", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.add_milestone(name: "1st milestone")
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: "1st milestone")
    |> Steps.add_milestone(name: "2nd milestone")
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: "2nd milestone")
    |> Steps.reload_project_page()
    |> Steps.assert_milestone_created(name: "1st milestone")
    |> Steps.assert_milestone_created(name: "2nd milestone")
  end

  feature "add multiple milestone with 'Create more' toggle on", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.add_multiple_milestones(names: ["1st milestone", "2nd milestone", "3rd milestone"])
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: "1st milestone")
    |> Steps.assert_milestone_created(name: "2nd milestone")
    |> Steps.assert_milestone_created(name: "3rd milestone")
    |> Steps.reload_project_page()
    |> Steps.assert_milestone_created(name: "1st milestone")
    |> Steps.assert_milestone_created(name: "2nd milestone")
    |> Steps.assert_milestone_created(name: "3rd milestone")
  end

  feature "add milestone with due date", ctx do
    next_friday = get_next_friday()
    formatted_date = Calendar.strftime(next_friday, "%b %d")

    ctx
    |> Steps.visit_project_page()
    |> Steps.add_milestone(name: "My milestone", due_date: next_friday)
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: "My milestone", due_date: formatted_date)
    |> Steps.reload_project_page()
    |> Steps.assert_milestone_created(name: "My milestone", due_date: formatted_date)
  end

  feature "edit a milestone from project timeline", ctx do
    next_friday = get_next_friday()
    formatted_date = Calendar.strftime(next_friday, "%b %d")

    ctx
    |> Steps.given_that_a_milestone_exists("My milestone")
    |> Steps.visit_project_page()
    |> Steps.edit_milestone(name: "My milestone", new_name: "Edited milestone", new_due_date: next_friday)
    |> Steps.assert_milestone_updated(name: "Edited milestone", due_date: formatted_date)
    |> Steps.reload_project_page()
    |> Steps.assert_milestone_updated(name: "Edited milestone", due_date: formatted_date)
  end

  defp get_next_friday do
    Date.utc_today()
    |> Date.add(((5 - Date.day_of_week(Date.utc_today())) + 7) |> rem(7) |> Kernel.+(7))
  end
end
