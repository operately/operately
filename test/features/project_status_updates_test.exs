defmodule Operately.Features.ProjectStatusUpdatesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
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
    |> NotificationsSteps.assert_project_status_update_submitted_sent(author: ctx.champion)

    ctx
    |> ProjectSteps.assert_email_sent_to_all_contributors(
      subject: "Operately (#{ctx.company.name}): #{Person.short_name(ctx.champion)} posted an update for #{ctx.project.name}",
      except: [ctx.champion.email]
    )
  end

  @tag login_as: :champion
  feature "acknowledge a status update", ctx do
    ctx
    |> ProjectSteps.submit_status_update(content: "This is a status update.")

    ctx
    |> UI.login_as(ctx.reviewer)
    |> ProjectSteps.visit_project_page()
    |> ProjectSteps.acknowledge_status_update()

    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_project_update_acknowledged_sent(author: ctx.reviewer)
    |> EmailSteps.assert_project_update_acknowledged_sent(author: ctx.reviewer, to: ctx.champion)
  end

  @tag login_as: :champion
  feature "leave a comment on an update", ctx do
    ctx
    |> ProjectSteps.submit_status_update(content: "This is a status update.")

    ctx
    |> UI.login_as(ctx.reviewer)
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "add-comment")
    |> UI.fill_rich_text("This is a comment.")
    |> UI.click(testid: "post-comment")

    ctx
    |> UI.login_as(ctx.champion)
    |> NotificationsSteps.assert_project_update_commented_sent(author: ctx.reviewer)
    |> EmailSteps.assert_project_update_commented_sent(author: ctx.reviewer, to: ctx.champion)
  end
end
