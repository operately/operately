defmodule Operately.Support.Features.ProjectCheckInsSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  @status_to_on_screen %{
    "on_track" => "On Track",
    "caution" => "Caution",
    "off_track" => "Off Track"
  }

  step :given_a_project_exists, ctx do
    # set @tag has_reviewer: false to not add a reviewer
    has_reviewer = Map.get(ctx, :has_reviewer, true)

    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_contributor(:developer, :project)
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
    ctx
    |> UI.login_as(ctx.creator)
  end

  step :log_in_as_reviewer, ctx do
    person = Operately.People.get_person!(ctx.reviewer.person_id)

    ctx |> UI.login_as(person)
  end

  step :submit_check_in, ctx, %{status: status, description: description} do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "tab-check-ins")
    |> UI.click(testid: "check-in-button")
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-#{status}")
    |> UI.fill_rich_text(description)
    |> UI.click(testid: "submit")
    |> UI.sleep(300)
    |> UI.assert_has(testid: "project-check-in-page")
    |> then(fn ctx ->
      check_in = Operately.Projects.CheckIn.get!(:system, project_id: ctx.project.id)
      Map.put(ctx, :check_in, check_in)
    end)
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

  step :assert_check_in_visible_on_project_page, ctx, %{description: description} do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "tab-check-ins")
    |> UI.assert_text(description)
  end

  step :visit_check_ins_tab, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "tab-check-ins")
  end

  step :assert_check_in_status_displayed, ctx, status do
    ctx
    |> UI.assert_text(@status_to_on_screen[status])
  end

  step :assert_check_in_visible_on_feed, ctx, %{description: description} do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "tab-activity")
    |> FeedSteps.assert_project_check_in_submitted(author: ctx.champion, description: description)
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> FeedSteps.assert_project_check_in_submitted(author: ctx.champion, project_name: ctx.project.name, description: description)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_check_in_submitted(author: ctx.champion, project_name: ctx.project.name, description: description)
  end

  step :assert_email_sent_to_reviewer, ctx, %{status: _status, description: _description} do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "submitted a check-in",
      author: ctx.champion
    })
  end

  step :assert_notification_sent_to_reviewer, ctx, %{status: _status, description: _description} do
    ctx
    |> Factory.log_in_contributor(:reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "Submitted a check-in"
    })
  end

  step :open_check_in_from_notifications, ctx do
    ctx
    |> NotificationsSteps.visit_notifications_page()
    |> UI.click(testid: "notification-item-project_check_in_submitted")
  end

  step :acknowledge_check_in, ctx do
    acknowledged_by = Map.get(ctx, :current_user)

    ctx
    |> UI.click(testid: "acknowledge-check-in")
    |> UI.sleep(300)
    |> Map.put(:last_acknowledged_by, acknowledged_by)
  end

  step :assert_check_in_acknowledged, ctx, %{status: _status, description: _description} do
    person =
      ctx.last_acknowledged_by
      |> case do
        nil -> Map.get(ctx, :current_user)
        other -> other
      end
      |> resolve_acknowledger(ctx)

    ctx |> UI.assert_text("#{person.full_name} acknowledged this Check-In")
  end

  step :assert_acknowledgement_email_sent_to_champion, ctx, %{status: _status, description: _description} do
    ctx
    |> UI.login_as(ctx.champion)
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      action: "acknowledged your check-in",
      author: ctx.reviewer
    })
  end

  step :assert_acknowledgement_email_sent_to_reviewer, ctx, %{status: _status, description: _description} do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "acknowledged your check-in",
      author: ctx.champion
    })
  end

  defp resolve_acknowledger(%Operately.People.Person{} = person, _ctx), do: person
  defp resolve_acknowledger(%{id: id}, _ctx), do: Operately.People.get_person!(id)
  defp resolve_acknowledger(id, _ctx) when is_binary(id), do: Operately.People.get_person!(id)
  defp resolve_acknowledger(_, ctx), do: Operately.People.get_person!(ctx.reviewer.person_id)

  step :assert_acknowledgement_notification_sent_to_champion, ctx, %{status: _status, description: _description} do
    ctx
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      where: ctx.project.name,
      to: ctx.champion,
      action: "Acknowledged check-in",
      author: ctx.reviewer
    })
  end

  step :assert_acknowledgement_visible_on_feed, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "tab-activity")
    |> FeedSteps.assert_project_check_in_acknowledged(author: ctx.champion)
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> FeedSteps.assert_project_check_in_acknowledged(author: ctx.champion, project_name: ctx.project.name)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_check_in_acknowledged(author: ctx.champion, project_name: ctx.project.name)
  end

  step :acknowledge_check_in_from_email, ctx, %{status: _status, description: _description} do
    ctx = Factory.log_in_contributor(ctx, :reviewer)
    person = Operately.People.get_person!(ctx.reviewer.person_id)
    email = UI.Emails.last_sent_email()
    link = UI.Emails.find_link(email, "Acknowledge")

    ctx
    |> UI.visit(link)
    |> Map.put(:last_acknowledged_by, person)
  end

  step :leave_comment_on_check_in, ctx do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("This is a comment.")
    |> UI.click(testid: "post-comment")
    |> UI.refute_has(testid: "post-comment")
    |> UI.sleep(300)
    |> then(fn ctx ->
      comment = last_comment(ctx)
      Map.put(ctx, :comment, comment)
    end)
  end

  step :assert_comment_on_check_in_received_in_notifications, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      where: ctx.project.name,
      action: "Re: project check-in",
      author: ctx.reviewer
    })
  end

  step :assert_comment_on_check_in_received_in_email, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.champion,
      action: "commented on a check-in",
      author: ctx.reviewer
    })
  end

  step :assert_check_in_comment_visible_on_feed, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "tab-activity")
    |> FeedSteps.assert_project_check_in_commented(author: ctx.champion, comment: "This is a comment.")
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> FeedSteps.assert_project_check_in_commented(author: ctx.champion, comment: "This is a comment.")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_project_check_in_commented(author: ctx.champion, comment: "This is a comment.")
  end

  step :assert_email_is_sent_to_contributors, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.developer,
      author: ctx.champion,
      action: "submitted a check-in"
    })
  end

  step :delete_comment, ctx do
    ctx
    |> UI.assert_text("This is a comment.")
    |> UI.click(testid: "comment-options")
    |> UI.click(testid: "delete-comment")
    |> UI.sleep(300)
  end

  step :assert_comment_deleted, ctx do
    ctx
    |> UI.refute_has(testid: "comment-#{ctx.comment.id}")
  end

  step :copy_comment_link, ctx do
    ctx
    |> UI.click(testid: "comment-options")
    |> UI.click(testid: "copy-comment-link")
    |> UI.sleep(100)
  end

  step :assert_comment_link_copied_message, ctx do
    ctx
    |> UI.assert_text("Success")
    |> UI.assert_text("The comment link has been copied to your clipboard")
  end

  defp last_comment(ctx) do
    Operately.Updates.list_comments(ctx.check_in.id, :project_check_in) |> List.last()
  end
end
