defmodule Operately.Features.ProjectStatusUpdatesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.ProjectCheckInSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.FeedSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @check_in_values %{
    content: "This is a status update.",
    status: "on_track",
    schedule: "on_schedule",
    budget: "within_budget",
    team: "staffed",
    risks: "no_known_risks",
    status_comments: "This is a status comment.",
    schedule_comments: "This is a schedule comment.",
    budget_comments: "This is a budget comment.",
    team_comments: "This is a team comment.",
    risks_comments: "This is a risk comment."
  }

  @tag login_as: :champion
  feature "submitting a status update", ctx do
    ctx
    |> ProjectCheckInSteps.submit_check_in(@check_in_values)
    |> ProjectCheckInSteps.assert_check_in_submitted(@check_in_values)

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("Check-in #{Operately.Time.current_month()} #{Operately.Time.current_day()}")

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "submitted a check-in"
    })  

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_status_update_submitted_sent(author: ctx.champion)
  end

  @tag login_as: :champion
  feature "submitted non-empty health statuses are expanded by default", ctx do
    check_in_with_missing = @check_in_values |> Map.put(:team_comments, "")

    ctx
    |> ProjectCheckInSteps.submit_check_in(check_in_with_missing)
    |> UI.assert_text("Check-In from")
    |> UI.assert_has(testid: "status-content")
    |> UI.assert_has(testid: "schedule-accordion-content")
    |> UI.assert_has(testid: "budget-accordion-content")
    |> UI.refute_has(testid: "team-acccordion-content")
    |> UI.assert_has(testid: "risks-accordion-content")
  end

  @tag login_as: :champion
  feature "submitting a status update is allowed to the champion only", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_has(testid: "check-in-now")

    ctx
    |> UI.login_as(ctx.reviewer)
    |> ProjectSteps.visit_project_page()
    |> UI.refute_has(testid: "check-in-now")
  end

  @tag login_as: :champion
  feature "submitting a status update moves the next update date", ctx do
    previous_due = ctx.project.next_update_scheduled_at

    ProjectCheckInSteps.submit_check_in(ctx, @check_in_values)

    current_due = Operately.Projects.get_project!(ctx.project.id).next_update_scheduled_at

    assert current_due == Operately.Time.calculate_next_check_in(previous_due, previous_due)
  end

  @tag login_as: :champion
  feature "acknowledge a status update", ctx do
    ctx
    |> ProjectCheckInSteps.submit_check_in(@check_in_values)

    ctx
    |> UI.login_as(ctx.reviewer)
    |> ProjectSteps.visit_project_page()
    |> ProjectSteps.follow_last_check_in()
    |> ProjectSteps.acknowledge_status_update()

    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_project_update_acknowledged_sent(author: ctx.reviewer)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "acknowledged your check-in"
    })  
  end

  @tag login_as: :champion
  feature "leave a comment on an update", ctx do
    ctx
    |> ProjectCheckInSteps.submit_check_in(@check_in_values)

    ctx
    |> UI.login_as(ctx.reviewer)
    |> ProjectSteps.visit_project_page()
    |> ProjectSteps.follow_last_check_in()
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("This is a comment.")
    |> UI.click(testid: "post-comment")

    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_project_update_commented_sent(author: ctx.reviewer)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "commented on a check-in" 
    })  
  end

  @tag login_as: :champion
  feature "when checking in, it pre-populates the previous check-in values", ctx do
    ctx
    |> ProjectCheckInSteps.submit_check_in(@check_in_values)
    |> ProjectCheckInSteps.assert_check_in_submitted(@check_in_values)

    ctx
    |> ProjectCheckInSteps.start_check_in()
    |> ProjectCheckInSteps.assert_previous_check_in_values(@check_in_values)
  end

  @tag login_as: :champion
  feature "pausing a project", ctx do
    check_in_paused = @check_in_values |> Map.put(:status, "paused")

    ctx
    |> ProjectCheckInSteps.submit_check_in(check_in_paused)
    |> ProjectCheckInSteps.assert_check_in_submitted(check_in_paused)

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("Check-in #{Operately.Time.current_month()} #{Operately.Time.current_day()}")
    |> UI.assert_text("Paused")
    |> FeedSteps.assert_project_paused(author: ctx.champion)

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "paused the project"
    })  

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_project_paused_sent(author: ctx.champion)
  end
end
