defmodule Operately.Support.Features.ProjectCheckInsSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  @status_to_on_screen %{
    "on_track" => "On Track",
    "caution" => "Caution",
    "issue" => "Issue",
  }

  step :given_a_project_exists, ctx do
    has_reviewer = Map.get(ctx, :has_reviewer, true) # set @tag has_reviewer: false to not add a reviewer

    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> then(fn ctx ->
      Map.put(ctx, :champion, ctx.creator)
    end)
    |> then(fn ctx ->
      if has_reviewer do
        Factory.add_project_reviewer(ctx, :reviewer, :project)
      else
        ctx
      end
    end)
  end

  step :log_in_as_champion, ctx do
    ctx |> UI.login_as(ctx.creator)
  end

  step :submit_check_in, ctx, %{status: status, description: description} do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "check-in-now")
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-#{status}")
    |> UI.fill_rich_text(description)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "project-check-in-page")
  end

  step :edit_check_in, ctx, %{status: status, description: description} do
    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "edit-check-in")
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-#{status}")
    |> UI.fill_rich_text(description)
    |> UI.click(testid: "submit")
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

  step :assert_check_in_visible_on_feed, ctx, %{description: description} do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> FeedSteps.assert_project_check_in_submitted(author: ctx.champion, description: description)
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> FeedSteps.assert_project_check_in_submitted(author: ctx.champion, project_name: ctx.project.name, description: description)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_check_in_submitted(author: ctx.champion, project_name: ctx.project.name, description: description)
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
    |> Factory.log_in_contributor(:reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "submitted a check-in",
    })
  end

  step :open_check_in_from_notifications, ctx, %{status: _status, description: _description} do
    ctx
    |> Factory.log_in_contributor(:reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> UI.click(testid: "notification-item-project_check_in_submitted")
  end

  step :acknowledge_check_in, ctx do
    ctx
    |> UI.click(testid: "acknowledge-check-in")
    |> UI.sleep(300) # Wait for the check-in to be acknowledged
  end

  step :assert_check_in_acknowledged, ctx, %{status: _status, description: _description} do
    person = Operately.People.get_person!(ctx.reviewer.person_id)

    ctx |> UI.assert_text("#{person.full_name} acknowledged this Check-In")
  end

  step :assert_acknowledgement_email_sent_to_champion, ctx, %{status: _status, description: _description} do
    ctx
    |> UI.login_as(ctx.champion)
    |> EmailSteps.assert_activity_email_sent(%{
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

  step :assert_acknowledgement_visible_on_feed, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> FeedSteps.assert_project_check_in_acknowledged(author: ctx.champion)
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> FeedSteps.assert_project_check_in_acknowledged(author: ctx.champion, project_name: ctx.project.name)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_check_in_acknowledged(author: ctx.champion, project_name: ctx.project.name)
  end

  step :acknowledge_check_in_from_email, ctx, %{status: _status, description: _description} do
    ctx = Factory.log_in_contributor(ctx, :reviewer)
    email = UI.Emails.last_sent_email()
    link = UI.Emails.find_link(email, "Acknowledge")

    UI.visit(ctx, link)
  end

  step :leave_comment_on_check_in, ctx do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("This is a comment.")
    |> UI.click(testid: "post-comment")
    |> UI.sleep(300) # Wait for the comment to be posted
  end

  step :assert_comment_on_check_in_received_in_notifications, ctx do
    ctx
    |> UI.login_as(ctx.champion)
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

  step :assert_check_in_comment_visible_on_feed, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> FeedSteps.assert_project_check_in_commented(author: ctx.champion, comment: "This is a comment.")
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> FeedSteps.assert_project_check_in_commented(author: ctx.champion, comment: "This is a comment.")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_check_in_commented(author: ctx.champion, comment: "This is a comment.")
  end
end
