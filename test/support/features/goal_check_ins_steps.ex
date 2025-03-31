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

  step :initiate_check_in, ctx do
    ctx |> UI.click(testid: "check-in-button")
  end

  step :select_status, ctx, status do
    ctx 
    |> UI.click(testid: "status-dropdown") 
    |> UI.click(testid: UI.testid(["status", "option", status]))
  end

  step :update_target, ctx, %{name: name, change: change} do
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

  step :fill_in_message, ctx, message do
    ctx |> UI.fill_rich_text(message)
  end

  step :submit_check_in, ctx do
    ctx |> UI.click(testid: "submit")
  end

  step :assert_check_in_submitted, ctx, %{status: status, message: message} do
    ctx 
    |> UI.assert_has(testid: "goal-check-in-page")
    |> UI.assert_text("Check-In")
    |> UI.assert_text(String.downcase(status))
    |> UI.assert_text(message)
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

  step :assert_target_updated, ctx, %{change: change} do
    change_text = if change > 0, do: "+#{change}", else: "#{change}"

    ctx 
    |> UI.assert_has(testid: "goal-check-in-page")
    |> UI.assert_text(change_text)
  end

  step :assert_check_in_in_notifications, ctx do
    ctx |> UI.click(testid: "something")
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

  step :extend_timeframe, ctx do
    ctx 
    |> UI.click(testid: "edit-timeframe")
    # todo
  end

  step :assert_timeframe_extended_message_visible, ctx do
    ctx |> UI.assert_text("Extended by 1 month")
  end

  step :given_a_check_in_was_submitted_on_a_goal_that_i_review, ctx do
    ctx |> Factory.add_goal_update(:check_in, :goal, :champion)
  end

  step :acknowledge_check_in, ctx do
    ctx 
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(Paths.goal_check_in_path(ctx.company, ctx.check_in))
    |> UI.click(testid: "acknowledge-check-in")
  end

  step :assert_check_in_acknowledged_email_sent_to_champion, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "acknowledged your check-in"
    })
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
    email = UI.Emails.last_sent_email()
    link = UI.Emails.find_link(email, "Acknowledge")

    UI.visit(ctx, link)
  end

  step :given_i_submitted_a_check_in, ctx do
    ctx |> Factory.add_goal_update(:check_in, :goal, :champion)
  end

  step :initiate_editing_check_in, ctx do
    ctx |> UI.click(testid: "something")
  end

  step :select_caution, ctx do
    ctx |> UI.click(testid: "status-dropdown") |> UI.click(testid: "status-dropdown-caution")
  end

  step :assert_check_in_edited, ctx do
    ctx |> UI.click(testid: "something")
  end

  step :given_a_check_in_exists, ctx do
    ctx |> Factory.add_goal_update(:check_in, :goal, :champion)
  end

  step :comment_on_check_in, ctx, message do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(Paths.goal_check_in_path(ctx.company, ctx.check_in))
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(message)
    |> UI.click(testid: "post-comment")
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

  step :assert_check_in_commented_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "commented on the check-in"
    })
  end

  defp target_input_test_id(name) do
    UI.testid(["target", "input", name])
  end

  defp find_target_by_name(ctx, name) do
    Repo.preload(ctx.goal, :targets).targets |> Enum.find(&(&1.name == name))
  end
end
