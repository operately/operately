defmodule Operately.Features.NotificationsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  
  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :reviewer
  feature "unread notifications count", ctx do
    ctx
    |> UI.visit("/projects")
    |> UI.click(testid: "add-project")
    |> UI.fill(testid: "project-name-input", with: "Website Redesign")
    |> UI.select_person(ctx.champion.full_name)
    |> UI.select(testid: "your-role-input", option: "Reviewer")
    |> UI.click(testid: "save")
    |> UI.assert_text("Website Redesign")

    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_notification_count(1)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.click_on_first_notification()
    |> NotificationsSteps.assert_no_unread_notifications()
  end

end
