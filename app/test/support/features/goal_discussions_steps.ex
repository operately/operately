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
  alias Operately.Access.Binding
  import Ecto.Query

  step :setup, ctx do
    company = company_fixture(%{name: "Test Org", enabled_experimental_features: ["goals"]})
    champion = person_fixture_with_account(%{company_id: company.id, full_name: "John Champion"})
    reviewer = person_fixture_with_account(%{company_id: company.id, full_name: "Leonardo Reviewer"})
    group = group_fixture(champion, %{company_id: company.id, name: "Test Group"})

    goal =
      goal_fixture(champion, %{
        company_id: company.id,
        space_id: group.id,
        champion_id: champion.id,
        reviewer_id: reviewer.id
      })

    {:ok, _} =
      Operately.Groups.add_members(champion, group.id, [
        %{id: reviewer.id, access_level: Binding.comment_access()}
      ])

    ctx = Map.merge(ctx, %{company: company, champion: champion, reviewer: reviewer, group: group, goal: goal})
    ctx = UI.login_based_on_tag(ctx)

    ctx
  end

  step :start_new_discussion, ctx, params do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal, tab: "discussions"))
    |> UI.click(testid: "start-discussion")
    |> UI.fill(testid: "discussion-title", with: params.title)
    |> UI.fill_rich_text(params.message)
    |> UI.click(testid: "post-discussion")
    |> UI.sleep(300)
  end

  step :assert_discussion_submitted, ctx, params do
    ctx
    |> UI.assert_text(params.title)
    # give it a moment to load the discussion
    |> UI.sleep(100)

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
      action: "posted: #{last_comment_thread().title}"
    })
  end

  step :assert_discussion_submitted_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal, tab: "activity"))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.champion,
      title: "posted #{last_comment_thread().title}",
      subtitle: last_comment_thread().message
    })
  end

  step :assert_discussion_submitted_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "Posted: #{last_comment_thread().title}"
    })
  end

  step :edit_discussion, ctx, params do
    ctx
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
    |> UI.click(testid: "notification-item-goal_discussion_creation")
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(message)
    |> UI.click(testid: "post-comment")
    # give it a moment for the comment to be submitted
    |> UI.sleep(500)
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
      action: "commented on: #{last_comment_thread().title}"
    })
  end

  step :assert_comment_submitted_feed_posted, ctx do
    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal, tab: "activity"))
    |> FeedSteps.assert_feed_item_exists(%{
      author: ctx.champion,
      title: "commented on #{last_comment_thread().title}",
      subtitle: last_comment_thread().message
    })
  end

  step :assert_comment_submitted_notification_sent, ctx do
    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.reviewer,
      action: "Re: #{last_comment_thread().title}"
    })
  end

  step :leave_comment, ctx, message do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(message)
    |> UI.click(testid: "post-comment")
    |> UI.sleep(300)
    |> UI.refute_has(testid: "post-comment")
    |> then(fn ctx ->
      comment = last_comment()
      Map.put(ctx, :comment, comment)
    end)
  end

  step :delete_comment, ctx, message do
    ctx
    |> UI.assert_text(message)
    |> UI.click(testid: "comment-options")
    |> UI.click(testid: "delete-comment")
    |> UI.sleep(300)
  end

  step :assert_comment_deleted, ctx do
    ctx
    |> UI.refute_has(testid: "comment-#{ctx.comment.id}")
  end

  step :assert_comment_feed_posted_after_deletion, ctx do
    author = ctx.champion

    ctx
    |> UI.visit(Paths.goal_path(ctx.company, ctx.goal, tab: "activity"))
    |> FeedSteps.assert_feed_item_exists(%{
      author: author,
      title: "commented on #{last_comment_thread().title}"
    })
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> FeedSteps.assert_feed_item_exists(%{
      author: author,
      title: "commented on #{last_comment_thread().title} in the #{ctx.goal.name} goal"
    })
    |> UI.visit(Paths.feed_path(ctx.company))
    |> FeedSteps.assert_feed_item_exists(%{
      author: author,
      title: "commented on #{last_comment_thread().title} in the #{ctx.goal.name} goal"
    })
  end

  step :assert_navigation_shows_space_and_goal, ctx do
    ctx
    |> UI.assert_text(ctx.group.name)
    |> UI.assert_text("Work Map")
    |> UI.assert_text(ctx.goal.name)
  end

  step :navigate_to_goal_from_discussion, ctx do
    UI.click(ctx, testid: UI.testid(["nav-item", "Discussions"]))
  end

  step :assert_goal_discussions_tab, ctx do
    ctx
    |> UI.assert_page(Paths.goal_path(ctx.company, ctx.goal))
    |> UI.assert_text("Discussions")
    |> UI.assert_has(testid: "start-discussion")
  end

  #
  # Helper functions
  #

  defp last_activity do
    query =
      from a in Operately.Activities.Activity,
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
