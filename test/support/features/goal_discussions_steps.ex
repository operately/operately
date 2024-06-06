defmodule Operately.Support.Features.GoalDiscussionsSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.FeedSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import Ecto.Query

  step :setup, ctx do
    company = company_fixture(%{name: "Test Org", enabled_experimental_features: ["goals"]})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})
    group = group_fixture(champion, %{company_id: company.id, name: "Test Group"})
    goal = goal_fixture(champion, %{
      company_id: company.id,
      space_id: group.id,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
    })

    ctx = Map.merge(ctx, %{company: company, champion: champion, reviewer: reviewer, group: group, goal: goal})
    ctx = UI.login_based_on_tag(ctx)

    ctx
  end

  step :start_new_discussion, ctx, params do
    ctx
    |> UI.visit("/goals/#{ctx.goal.id}/discussions")
    |> UI.click(testid: "start-discussion")
    |> UI.fill(testid: "discussion-title", with: params.title)
    |> UI.fill_rich_text(params.message)
    |> UI.click(testid: "post-discussion")
  end

  step :assert_discussion_submitted, ctx, params do
    ctx
    |> UI.assert_text(params.title)

    activity = last_activity()
    comment_thread = last_comment_thread()

    assert activity != nil
    assert comment_thread != nil

    assert activity.author_id == ctx.champion.id
    assert comment_thread.title == params.title

    ctx
  end

  step :assert_discussion_submitted_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.reviewer,
      author: ctx.champion,
      action: "posted: #{last_comment_thread().title}",
    })
  end

  step :assert_discussion_submitted_feed_posted, ctx do
    ctx
    |> UI.visit("/goals/#{ctx.goal.id}")
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.champion,
      title: "posted #{last_comment_thread().title}",
      subtitle: last_comment_thread().message,
    })
  end

  step :assert_discussion_submitted_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "posted: #{last_comment_thread().title}",
    })
  end

  step :edit_discussion, ctx, params do
    ctx
    |> UI.click(testid: "options")
    |> UI.click(testid: "edit")
    |> UI.fill(testid: "discussion-title", with: params.title)
    |> UI.fill_rich_text(params.message)
    |> UI.click(testid: "save")
    |> UI.sleep(100)
  end

  step :assert_discusssion_edited, ctx, params do
    comment_thread = last_comment_thread()

    assert String.contains?(comment_thread.title, params.title)
    assert Jason.encode!(comment_thread.message) |> String.contains?(params.message)

    ctx
  end

  step :comment_on_discussion, ctx, message do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> UI.click(testid: "goal-discussion-creation")
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(message)
    |> UI.click(testid: "post-comment")
  end

  step :assert_comment_submitted, ctx, message do
    comment = last_comment()

    assert comment != nil
    assert comment.author_id == ctx.reviewer.id
    assert Jason.encode!(comment.content["message"]) |> String.contains?(message)

    ctx
  end

  step :assert_comment_submitted_email_sent, ctx do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.goal.name,
      to: ctx.champion,
      author: ctx.reviewer,
      action: "commented on: #{last_comment_thread().title}",
    })
  end

  step :assert_comment_submitted_feed_posted, ctx do
    ctx
    |> UI.visit("/goals/#{ctx.goal.id}")
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.champion,
      title: "commented on #{last_comment_thread().title}",
      subtitle: last_comment_thread().message,
    })
  end

  step :assert_comment_submitted_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "commented on #{last_comment_thread().title}",
    })
  end

  #
  # Helper functions
  #

  defp last_activity do
    query = from a in Operately.Activities.Activity,
      where: a.action == "goal_discussion_creation",
      order_by: [desc: a.inserted_at],
      preload: [:author],
      limit: 1

    Operately.Repo.one(query)
  end

  defp last_comment_thread do
    activity = last_activity()
    Operately.Comments.get_thread!(activity.comment_thread_id)
  end

  defp last_comment do
    comment_thread = last_comment_thread()
    Operately.Updates.list_comments(comment_thread.id, :comment_thread) |> Enum.at(-1)
  end

end
