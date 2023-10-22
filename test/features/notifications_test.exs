defmodule Operately.Features.NotificationsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.People.Person
  
  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "unread notifications count", ctx do
    ctx
    |> ProjectSteps.post_new_discussion(
      title: "How are we going to do this?", 
      body: "I think we should do it like this... I would like to hear your thoughts."
    )

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.assert_notification_count(1)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.click_on_first_notification()
    |> NotificationsSteps.assert_no_unread_notifications()
  end

end
