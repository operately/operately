defmodule Operately.Features.ProjectMilestones.ProjectPageFlowTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectMilestonesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "project timeline zero state", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.assert_project_milestones_zero_state()
  end

  feature "add first milestone", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.add_first_milestone(name: "My milestone")
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: "My milestone")
  end

  feature "add milestones to project", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
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

  feature "add milestone to project that doesn't have a champion", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_that_milestone_project_doesnt_have_champion()
    |> Steps.visit_project_page()
    |> Steps.add_milestone(name: "My milestone")
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: "My milestone")
    |> Steps.reload_project_page()
    |> Steps.assert_milestone_created(name: "My milestone")
  end

  feature "add multiple milestone with 'Create more' toggle on", ctx do
    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
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
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.add_milestone(name: "My milestone", due_date: next_friday)
    |> Steps.assert_add_milestone_form_closed()
    |> Steps.assert_milestone_created(name: "My milestone", due_date: formatted_date)
    |> Steps.reload_project_page()
    |> Steps.assert_milestone_created(name: "My milestone", due_date: formatted_date)
  end

  feature "edit a milestone from project timeline", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_that_a_milestone_exists("My milestone")
    |> Steps.visit_project_page()
    |> Steps.edit_milestone(name: "My milestone", new_name: "Edited milestone", new_due_date: next_friday)
    |> Steps.assert_milestone_updated(name: "Edited milestone", due_date: formatted_date)
    |> Steps.reload_project_page()
    |> Steps.assert_milestone_updated(name: "Edited milestone", due_date: formatted_date)
  end
end
