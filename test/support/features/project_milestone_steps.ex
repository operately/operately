defmodule Operately.Support.Features.ProjectMilestoneSteps do
  alias Operately.Support.Features.{UI, EmailSteps, NotificationsSteps}
  alias Operately.People.Person

  def given_that_a_milestone_exists(ctx, title) do
    {:ok, milestone} = Operately.Projects.create_milestone(ctx.champion, %{
      project_id: ctx.project.id,
      title: title,
      deadline_at: ~N[2023-06-17 00:00:00]
    })

    Map.put(ctx, :milestone, milestone)
  end

  def visit_milestone_page(ctx) do
    path = "/projects/#{ctx.project.id}/milestones/#{ctx.milestone.id}"
    UI.visit(ctx, path)
  end

  def leave_a_comment(ctx, comment) do
    ctx
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text(comment)
    |> UI.click(testid: "post-comment")
  end

  def assert_comment_visible_in_project_feed(ctx, comment) do
    ctx
    |> UI.visit("/projects/#{ctx.project.id}")
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el
      |> UI.assert_text(Person.short_name(ctx.champion) <> " commented on the " <> ctx.milestone.title <> " milestone")
      |> UI.assert_text(comment)
    end)
  end

  def assert_comment_email_sent_to_project_reviewer(ctx) do
    ctx |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "commented on the #{ctx.milestone.title} milestone",
      author: ctx.champion,
    })
  end

  def assert_comment_notification_sent_to_project_reviewer(ctx) do
    ctx
    |> UI.login_as(ctx.reviewer)
    |> UI.visit("/notifications")
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "commented on: #{ctx.milestone.title}"
    })
  end

end
