defmodule Operately.Support.Features.ProjectCheckInSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  @status_to_on_screen %{
    "on_track" => "On Track",
    "caution" => "Caution",
    "issue" => "Issue",
  }

  step :submit_check_in, ctx, %{status: status, description: description} do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "check-in-now")
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-#{status}")
    |> UI.fill_rich_text(description)
    |> UI.click(testid: "post-check-in")
    |> UI.assert_text("Check-In from")
  end

  step :edit_check_in, ctx, %{status: status, description: description} do
    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "edit-check-in")
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-#{status}")
    |> UI.fill_rich_text(description)
    |> UI.click(testid: "save-changes")
    |> UI.assert_text("Check-In from")
  end

  step :assert_check_in_submitted, ctx, %{status: status, description: description} do
    ctx
    |> UI.assert_text("Check-In from")
    |> UI.assert_text(description)
    |> UI.assert_text(@status_to_on_screen[status])
  end

  step :assert_check_in_visible_on_project_page, ctx, %{status: status, description: description} do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.assert_text(description)
    |> UI.assert_text(@status_to_on_screen[status])
  end

  step :assert_check_in_visible_on_feed, ctx, %{status: status, description: description} do
    ctx
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el
      |> UI.assert_text(description)
      |> UI.assert_text(@status_to_on_screen[status])
    end)
  end

  step :assert_email_sent_to_reviewer, ctx, %{status: _status, description: _description} do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "submitted a check-in",
      author: ctx.champion,
    })
  end

  step :assert_notification_sent_to_reviewer, ctx, %{status: _status, description: _description} do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "submitted a check-in",
    })
  end

  step :assert_next_check_in_scheduled, ctx, %{status: _status, description: _description} do
    project = Operately.Projects.get_project!(ctx.project.id)

    assert Date.diff(project.next_check_in_scheduled_at, Date.utc_today()) >= 7

    ctx
  end

  step :open_check_in_from_notifications, ctx, %{status: _status, description: _description} do
    ctx
    |> NotificationsSteps.visit_notifications_page()
    |> UI.click(testid: "notification-item-project_check_in_submitted")
  end

  step :acknowledge_check_in, ctx do
    ctx |> UI.click(testid: "acknowledge-check-in")
  end

  step :assert_check_in_acknowledged, ctx, %{status: _status, description: _description} do
    ctx |> UI.assert_text("#{ctx.reviewer.full_name} acknowledged this Check-In")
  end

  step :assert_acknowledgement_email_sent_to_champion, ctx, %{status: _status, description: _description} do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      action: "acknowledged your check-in",
      author: ctx.reviewer,
    })
  end

  step :assert_acknowledgement_notification_sent_to_champion, ctx, %{status: _status, description: _description} do
    ctx
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      where: ctx.project.name,
      to: ctx.champion,
      action: "acknowledged your check-in",
      author: ctx.reviewer,
    })
  end

  step :assert_acknowledgement_visible_on_project_feed, ctx, %{status: _status, description: _description} do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el |> UI.assert_text("acknowledged")
    end)
  end

  step :acknowledge_check_in_from_email, ctx, %{status: _status, description: _description} do
    last_email = ctx |> UI.list_sent_emails() |> List.last()
    link = find_acknowledgement_url(last_email)

    UI.visit(ctx, link)
  end

  step :leave_comment_on_check_in, ctx do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("This is a comment.")
    |> UI.click(testid: "post-comment")
    |> UI.sleep(200) # Wait for the comment to be posted
  end

  step :assert_comment_on_check_in_received_in_notifications, ctx do
    ctx
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      where: ctx.project.name,
      action: "commented on the project check-in",
      author: ctx.reviewer,
    })
  end

  step :assert_comment_on_check_in_received_in_email, ctx do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      action: "commented on a check-in",
      author: ctx.reviewer,
    })
  end

  defp find_acknowledgement_url(email) do
    email.html_body
    |> Floki.find("a[href]") 
    |> Enum.find(fn el -> Floki.text(el) == "Acknowledge" end)
    |> Floki.attribute("href")
    |> hd()
    |> String.replace(OperatelyWeb.Endpoint.url(), "")
  end
end
