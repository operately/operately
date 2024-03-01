defmodule Operately.Support.Features.ProjectPausingSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias Operately.Support.Features.EmailSteps
  alias Operately.Support.Features.NotificationsSteps

  def pause_project(ctx) do
    ctx 
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "pause-project-link")
    |> UI.click(testid: "pause-project-button")
  end

  def assert_project_paused(ctx) do
    ctx |> UI.assert_text("Paused")
  end

  def assert_pause_notification_sent_to_reviewer(ctx) do
    ctx
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "paused the project",
    })
  end

  def assert_pause_email_sent_to_reviewer(ctx) do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "paused the project",
      author: ctx.champion,
    })
  end

  def assert_pause_visible_on_project_feed(ctx) do
    ctx
    |> UI.visit("/projects/#{ctx.project.id}")
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el |> UI.assert_text("paused the project")
    end)
  end

  def resume_project(ctx) do
    ctx 
    |> UI.click(testid: "project-options-button")
    |> UI.click(testid: "resume-project-link")
    |> UI.click(testid: "resume-project-button")
  end

  def assert_project_active(ctx) do
    ctx |> UI.assert_text("On Track")
  end

  def assert_resume_notification_sent_to_reviewer(ctx) do
    ctx
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "resumed the project",
    })
  end

  def assert_resume_email_sent_to_reviewer(ctx) do
    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: ctx.reviewer,
      action: "resumed the project",
      author: ctx.champion,
    })
  end

  def assert_resume_visible_on_project_feed(ctx) do
    ctx
    |> UI.visit("/projects/#{ctx.project.id}")
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el |> UI.assert_text("resumed the project")
    end)
  end

end
