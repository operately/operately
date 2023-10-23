defmodule Operately.Features.ProjectStatusUpdatesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.People.Person

  setup session do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, %{session: session, company: company, champion: champion, project: project}}
  end

  @login as: :champion
  feature "submitting a status update", state do
    state
    |> visit_page(state.project)
    |> UI.click(testid: "add-status-update")
    |> UI.fill_rich_text("This is a status update.")
    |> UI.click(testid: "post-status-update")
    |> assert_has(Query.text("This is a status update."))

    ctx
    |> UI.login_as(ctx.reviewer)
    |> NotificationsSteps.visit_notifications_page()
    |> NotificationsSteps.assert_notification_exists(
      author: ctx.champion, 
      subject: "#{Person.first_name(ctx.champion)} submitted a status update"
    )

    ctx
    |> ProjectSteps.assert_email_sent_to_all_contributors(
      subject: "#{Person.short_name(ctx.champion)} submitted a status update",
      except: [ctx.champion.email]
    )
  end

  #
  # Helpers
  #

  defp visit_page(state, project) do
    UI.visit(state, "/projects" <> "/" <> project.id)
  end

  defp create_project(company, champion) do
    params = %Operately.Projects.ProjectCreation{
      company_id: company.id,
      name: "Live support",
      champion_id: champion.id,
      creator_id: champion.id,
      creator_role: nil,
      visibility: "everyone",
    }

    {:ok, project} = Operately.Projects.create_project(params)

    project
  end
end
