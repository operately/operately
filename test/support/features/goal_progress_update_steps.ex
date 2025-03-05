defmodule Operately.Support.Features.GoalProgressUpdateSteps do
  use Operately.FeatureCase

  alias Operately.Access.Binding
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  step :setup, ctx do
    company = company_fixture(%{name: "Test Org", enabled_experimental_features: ["goals"]})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})
    group = group_fixture(champion, %{company_id: company.id, name: "Test Group", company_permissions: Binding.view_access()})

    timeframe = %{
      start_date: ~D[2023-01-01],
      end_date: ~D[2023-12-31],
      type: "year"
    }

    targets = [
      %{
        name: "First response time",
        from: 30,
        to: 15,
        unit: "minutes",
        index: 0
      },
      %{
        name: "Increase feedback score to 90%",
        from: 80,
        to: 90,
        unit: "percent",
        index: 1
      }
    ]

    {:ok, goal} = Operately.Goals.create_goal(champion, %{
      company_id: company.id,
      space_id: group.id,
      name: "Improve support first response time",
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      timeframe: timeframe,
      targets: targets,
      company_access_level: Binding.comment_access(),
      space_access_level: Binding.edit_access(),
      anonymous_access_level: Binding.view_access(),
    })

    ctx = Map.merge(ctx, %{company: company, champion: champion, reviewer: reviewer, group: group, goal: goal})
    ctx = UI.login_as(ctx, ctx.champion)

    ctx
  end

  step :update_progress, ctx, params do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.click(testid: "check-in-button")
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-#{params.status}")
    |> UI.fill_rich_text(params.message)
    |> UI.fill(testid: "target-first-response-time", with: to_string(Enum.at(params.target_values, 0)))
    |> UI.fill(testid: "target-increase-feedback-score-to-90-", with: to_string(Enum.at(params.target_values, 1)))
    |> UI.click(testid: "submit")
    |> UI.sleep(500)
  end

  step :assert_progress_updated, ctx, %{status: status, message: message, target_values: target_values} do
    ctx
    |> UI.assert_text("Progress Update from")
    |> UI.assert_text(format_status(status))
    |> UI.assert_text(message)
    |> UI.assert_text("First response time")
    |> UI.assert_text("Increase feedback score to 90%")
    |> UI.assert_text("#{Enum.at(target_values, 1)} / 90")
    |> UI.assert_text("#{Enum.at(target_values, 0)} / 15")
  end

  step :assert_progress_update_in_feed, ctx do
    feed_texts = ["Checking-in on my goal", "First response time", "Increase feedback score to 90%", "On Track"]

    ctx
    |> visit_page()
    |> FeedSteps.assert_goal_checked_in(author: ctx.champion, texts: feed_texts)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_goal_checked_in(author: ctx.champion, goal_name: ctx.goal.name, texts: feed_texts)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_goal_checked_in(author: ctx.champion, goal_name: ctx.goal.name, texts: feed_texts)
  end

  step :assert_progress_update_email_sent_to_reviewer, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "updated the progress"
    })
  end

  step :assert_progress_update_in_notifications, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "submitted a check-in"
    })
  end

  step :visit_page, ctx do
    UI.visit(ctx, Paths.goal_path(ctx.company, ctx.goal))
  end

  step :acknowledge_progress_update, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> UI.click(testid: "notification-item-goal_check_in")
    |> UI.click(testid: "acknowledge-check-in")
    |> UI.assert_text("Acknowledged by #{ctx.reviewer.full_name}")
  end

  step :assert_acknowledge_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "acknowledged your progress update"
    })
  end

  step :assert_progress_update_acknowledged_in_feed, ctx do
    ctx
    |> visit_page()
    |> FeedSteps.assert_goal_check_in_acknowledgement(author: ctx.champion)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_goal_check_in_acknowledgement(author: ctx.champion, goal_name: ctx.goal.name)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_goal_check_in_acknowledgement(author: ctx.champion, goal_name: ctx.goal.name)
  end

  step :assert_progress_update_acknowledged_in_notifications, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "acknowledged your progress update"
    })
  end

  step :edit_progress_update, ctx, params do
    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "edit-update")
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-#{params.status}")
    |> UI.fill_rich_text(params.message)
    |> UI.click(testid: "submit")
  end

  step :assert_progress_update_edited, ctx, params do
    ctx
    |> UI.assert_text("Progress Update from")
    |> UI.assert_text(format_status(params.status))
    |> UI.assert_text(params.message)
  end

  step :comment_on_progress_update_as_reviewer, ctx, message do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> UI.click(testid: "notification-item-goal_check_in")
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(message)
    |> UI.click(testid: "post-comment")
  end

  step :assert_progress_update_commented_in_feed, ctx, comment do
    ctx
    |> visit_page()
    |> FeedSteps.assert_goal_check_in_commented(author: ctx.champion, comment: comment)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_goal_check_in_commented(author: ctx.champion, goal_name: ctx.goal.name, comment: comment)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_goal_check_in_commented(author: ctx.champion, goal_name: ctx.goal.name, comment: comment)
  end

  step :assert_progress_update_commented_in_notifications, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "commented on the goal check-in"
    })
  end

  step :assert_progress_update_commented_notification_redirects_on_click, ctx do
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

  step :acknowledge_check_in_from_email, ctx do
    ctx = Factory.log_in_person(ctx, :reviewer)
    email = UI.Emails.last_sent_email()
    link = UI.Emails.find_link(email, "Acknowledge")

    UI.visit(ctx, link)
  end

  defp format_status(status) do
    status
    |> String.replace("_", " ")
    |> String.split()
    |> Enum.map(&String.capitalize/1)
    |> Enum.join(" ")
  end
end
