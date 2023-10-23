defmodule Operately.Features.ProjectStatusUpdatesTest do
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
  feature "submitting a status update", ctx do
    ctx
    |> ProjectSteps.submit_status_update(content: "This is a status update.")

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_notification_exists(
      author: ctx.champion, 
      subject: "#{Person.first_name(ctx.champion)} submitted a status update"
    )

    ctx
    |> ProjectSteps.assert_email_sent_to_all_contributors(
      subject: "Operately (#{ctx.company.name}): #{Person.short_name(ctx.champion)} posted an update for #{ctx.project.name}",
      except: [ctx.champion.email]
    )
  end
end
