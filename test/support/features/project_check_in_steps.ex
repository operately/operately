defmodule Operately.Support.Features.ProjectCheckInSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  @status_to_on_screen %{
    "on_track" => "On Track",
    "at_risk" => "At Risk",
    "off_track" => "Off Track"
  }

  def submit_check_in(ctx, %{status: status, description: description}) do
    ctx
    |> UI.visit("/projects/#{ctx.project.id}")
    |> UI.click(testid: "check-in-now")
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-#{status}")
    |> UI.fill_rich_text(description)
    |> UI.click(testid: "post-check-in")
    |> UI.assert_text("Check-In from")
  end

  def assert_check_in_submitted(ctx, %{status: status, description: description}) do
    ctx
    |> UI.assert_text("Check-In from")
    |> UI.assert_text(description)
    |> UI.assert_text(@status_to_on_screen[status])
  end

  def assert_check_in_visible_on_project_page(ctx, %{status: status, description: description}) do
    ctx
    |> UI.visit("/projects/#{ctx.project.id}")
    |> UI.assert_text(description)
    |> UI.assert_text(@status_to_on_screen[status])
  end

  def assert_check_in_visible_on_feed(ctx, %{status: status, description: description}) do
    ctx
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el
      |> UI.assert_text(description)
      |> UI.assert_text(@status_to_on_screen[status])
    end)
  end

  def assert_email_sent_to_reviewer(ctx, %{status: _status, description: _description}) do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "submitted a check-in",
      author: ctx.champion,
    })
  end

  def assert_notification_sent_to_reviewer(ctx, %{status: _status, description: _description}) do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "submitted a check-in",
    })
  end

  def assert_next_check_in_scheduled(ctx, %{status: _status, description: _description}) do
    project = Operately.Projects.get_project!(ctx.project.id)

    assert Date.diff(project.next_check_in_scheduled_at, Date.utc_today()) >= 7

    ctx
  end

  def open_check_in_from_notifications(ctx, %{status: _status, description: _description}) do
    ctx
    |> NotificationsSteps.visit_notifications_page()
    |> UI.click(testid: "project-check-in-submitted")
  end

  def acknowledge_check_in(ctx) do
    ctx |> UI.click(testid: "acknowledge-check-in")
  end

  def assert_check_in_acknowledged(ctx, %{status: _status, description: _description}) do
    ctx |> UI.assert_text("#{ctx.reviewer.full_name} acknowledged this Check-In")
  end

  def assert_acknowledgement_email_sent_to_champion(ctx, %{status: _status, description: _description}) do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      action: "acknowledged your check-in",
      author: ctx.reviewer,
    })
  end

  def assert_acknowledgement_notification_sent_to_champion(ctx, %{status: _status, description: _description}) do
    ctx
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      where: ctx.project.name,
      to: ctx.champion,
      action: "acknowledged your check-in",
      author: ctx.reviewer,
    })
  end

  def assert_acknowledgement_visible_on_project_feed(ctx, %{status: _status, description: _description}) do
    ctx
    |> UI.visit("/projects/#{ctx.project.id}")
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el |> UI.assert_text("acknowledged")
    end)
  end
end
