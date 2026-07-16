defmodule Operately.Features.ProjectMilestones.DetailsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectMilestonesSteps, as: Steps
  alias Operately.Support.Features.ProjectSteps

  setup ctx, do: Steps.setup(ctx)
  setup ctx, do: Steps.setup_milestone(ctx)

  feature "assert newly created milestone page", ctx do
    due_date = get_milestone_due_date(ctx.milestone)
    formatted_date = Operately.Support.Time.format_month_day(due_date)

    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.visit_milestone_page()
    |> Steps.assert_empty_description()
    |> Steps.assert_milestone_status("Active")
    |> Steps.assert_milestone_timeline_empty()
    |> Steps.assert_milestone_due_date(formatted_date)
  end

  feature "milestone page hides space navigation when space is not accessible", ctx do
    ctx
    |> ProjectSteps.given_company_members_cannot_access_space()
    |> ProjectSteps.login_as_reviewer()
    |> Steps.visit_milestone_page()
    |> Steps.assert_milestone_navigation_without_space()
  end

  feature "edit milestone due date", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    ctx
    |> Steps.log_in_as_champion()
    |> Steps.visit_milestone_page()
    |> Steps.edit_milestone_due_date(next_friday)
    |> Steps.assert_milestone_due_date(formatted_date)
    |> Steps.assert_activity_added_to_feed("updated the milestone")
    |> Steps.reload_milestone_page()
    |> Steps.assert_milestone_due_date(formatted_date)
    |> Steps.assert_activity_added_to_feed("updated the milestone")
    |> Steps.assert_milestone_due_date_change_visible_in_feed()
  end

  feature "edit milestone due date when project doesn't have a champion", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    ctx
    |> Steps.log_in_as_contributor()
    |> Steps.assert_contributor_has_edit_access()
    |> Steps.given_that_milestone_project_doesnt_have_champion()
    |> Steps.visit_milestone_page()
    |> Steps.edit_milestone_due_date(next_friday)
    |> Steps.assert_milestone_due_date(formatted_date)
    |> Steps.reload_milestone_page()
    |> Steps.assert_milestone_due_date(formatted_date)
  end

  feature "edit milestone due date sends notification to subscribed people", ctx do
    next_friday = Operately.Support.Time.next_friday()
    formatted_date = Operately.Support.Time.format_month_day(next_friday)

    ctx
    |> Steps.log_in_as_champion()
    |> Steps.visit_milestone_page()
    |> Steps.subscribe_to_milestone()

    ctx
    |> UI.login_as(ctx.reviewer)
    |> Steps.visit_milestone_page()
    |> Steps.edit_milestone_due_date(next_friday)
    |> Steps.assert_milestone_due_date(formatted_date)
    |> Steps.assert_due_date_changed_notification_sent()
    |> Steps.assert_due_date_changed_email_sent()
  end

  defp get_milestone_due_date(milestone) do
    Operately.ContextualDates.Timeframe.end_date(milestone.timeframe)
  end
end
