defmodule Operately.Support.Features.GoalCheckInsSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer)
    |> Factory.log_in_person(:champion)
    |> then(fn ctx ->
      UI.visit(ctx, Paths.goal_path(ctx.company, ctx.goal))
    end)
  end

  step :check_in, ctx, %{status: status, targets: targets, message: message} do
    ctx
    |> UI.click(testid: "check-in-button")
    |> select_status(status)
    |> update_targets(targets)
    |> UI.fill_rich_text(message)
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "goal-check-in-page")
  end

  step :assert_check_in_feed_item, ctx, %{message: message} do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> FeedSteps.assert_goal_checked_in(author: ctx.champion, texts: [message])
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> FeedSteps.assert_goal_checked_in(author: ctx.champion, goal_name: ctx.goal.name, texts: [message])
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_goal_checked_in(author: ctx.champion, goal_name: ctx.goal.name, texts: [message])
  end

  step :assert_check_in_notifications, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "submitted a check-in"
    })
  end

  step :assert_check_in_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "submitted a check-in"
    })
  end

  step :acknowledge_check_in, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(Paths.goal_check_in_path(ctx.company, ctx.check_in))
    |> UI.click(testid: "acknowledge-check-in")
  end

  step :assert_check_in_acknowledged_in_feed, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> FeedSteps.assert_goal_check_in_acknowledgement(author: ctx.champion)
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> FeedSteps.assert_goal_check_in_acknowledgement(author: ctx.champion, goal_name: ctx.goal.name)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_goal_check_in_acknowledgement(author: ctx.champion, goal_name: ctx.goal.name)
  end

  step :assert_check_in_acknowledged_in_notifications, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "acknowledged your check-in"
    })
  end

  step :acknowledge_check_in_from_email, ctx do
    ctx = Factory.log_in_person(ctx, :reviewer)
    email = UI.Emails.last_sent_email(to: ctx.reviewer.email)
    link = UI.Emails.find_link(email, "Acknowledge")

    UI.visit(ctx, link)
  end

  step :given_a_check_in_exists, ctx do
    ctx |> Factory.add_goal_update(:check_in, :goal, :champion)
  end

  step :assert_check_in_commented_in_feed, ctx, message do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> FeedSteps.assert_goal_check_in_commented(author: ctx.champion, comment: message)
    |> UI.visit(Paths.space_path(ctx.company, ctx.space))
    |> FeedSteps.assert_goal_check_in_commented(author: ctx.champion, goal_name: ctx.goal.name, comment: message)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_goal_check_in_commented(author: ctx.champion, goal_name: ctx.goal.name, comment: message)
  end

  step :assert_check_in_commented_in_notifications, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "commented on the goal check-in"
    })
  end

  step :assert_acknowledge_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "acknowledged your check-in"
    })
  end

  step :edit_check_in, ctx, %{status: status, targets: targets, message: message} do
    ctx
    |> UI.click(testid: "edit-check-in")
    |> select_status(status)
    |> update_targets(targets)
    |> UI.fill_rich_text(message)
    |> UI.click(testid: "submit")
  end

  step :assert_check_in_edited, ctx, params do
    ctx
    |> UI.assert_text(params.status)
    |> UI.assert_text(params.message)
  end

  step :comment_on_check_in_as_reviewer, ctx, message do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(Paths.goal_check_in_path(ctx.company, ctx.check_in))
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(message)
    |> UI.click(testid: "post-comment")
  end

  step :assert_check_in_commented_notification_redirects_on_click, ctx do
    update = Operately.Goals.list_updates(ctx.goal) |> hd()

    ctx
    |> UI.click(testid: "notification-item-goal_check_in_commented")
    |> UI.assert_page(Paths.goal_check_in_path(ctx.company, update))
  end

  step :assert_comment_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "commented on the check-in"
    })
  end

  step :given_a_reviewer_submitted_check_in, ctx do
    ctx |> Factory.add_goal_check_in(:check_in, :goal, :reviewer)
  end

  step :acknowledge_check_in_from_email_as_champion, ctx do
    ctx
    |> EmailSteps.assert_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "submitted a check-in"
    })

    last_email = UI.Emails.last_sent_email(to: ctx.champion.email)
    link = UI.Emails.find_link(last_email, "Acknowledge")

    ctx |> UI.visit(link)
  end

  step :assert_acknowledged_email_sent_to_reviewer, ctx do
    ctx
    |> EmailSteps.assert_email_sent(%{
      where: ctx.goal.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "acknowledged your check-in"
    })
  end

  defp target_input_test_id(name) do
    UI.testid(["target", "input", name])
  end

  defp find_target_by_name(ctx, name) do
    Repo.preload(ctx.goal, :targets).targets |> Enum.find(&(&1.name == name))
  end

  defp update_targets(ctx, targets) do
    Enum.reduce(targets, ctx, fn {name, value}, ctx ->
      update_target(ctx, %{name: name, change: value})
    end)
  end

  defp update_target(ctx, %{name: name, change: change}) do
    target = find_target_by_name(ctx, name)
    testid = target_input_test_id(name)
    value = target.from + change

    # What does \b\b\b\b\b\b do?
    #
    # If you leave the input empty, it will default to the target's from value
    # so the default clear that is executed by the fill function is not working
    # well here. Instead, we are injecting a backspace sequence to clear the input.

    UI.fill(ctx, testid: testid, with: "\b\b\b\b\b\b#{value}")
  end

  defp select_status(ctx, status) do
    ctx
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: UI.testid(["status", "option", status]))
  end

end
