defmodule Operately.Support.Features.ProjectMilestonesSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.{EmailSteps, NotificationsSteps, FeedSteps}
  alias OperatelyWeb.Paths

  step :given_that_a_milestone_exists, ctx, title do
    {:ok, milestone} = Operately.Projects.create_milestone(ctx.champion, %{
      project_id: ctx.project.id,
      title: title,
      deadline_at: ~N[2023-06-17 00:00:00]
    })

    Map.put(ctx, :milestone, milestone)
  end

  step :visit_milestone_page, ctx do
    path = Paths.project_milestone_path(ctx.company, ctx.milestone)
    UI.visit(ctx, path)
  end

  step :leave_a_comment, ctx, comment do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(comment)
    |> UI.click(testid: "post-comment")
    |> UI.sleep(300)
  end

  step :assert_comment_visible_in_feed, ctx, comment do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(author: ctx.champion, milestone_tile: ctx.milestone.title, comment: comment)
    end)
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.find(UI.query(testid: "space-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(author: ctx.champion, milestone_tile: ctx.milestone.title, comment: comment)
    end)
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.find(UI.query(testid: "company-feed"), fn el ->
      el
      |> FeedSteps.assert_project_milestone_commented(author: ctx.champion, milestone_tile: ctx.milestone.title, comment: comment)
    end)
  end

  step :assert_comment_email_sent_to_project_reviewer, ctx do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "commented on the #{ctx.milestone.title} milestone",
      author: ctx.champion,
    })
  end

  step :assert_comment_notification_sent_to_project_reviewer, ctx do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit(Paths.notifications_path(ctx.company))
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "commented on #{ctx.milestone.title}"
    })
  end
end
