defmodule Operately.Features.ProjectStatusUpdatesTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures

  setup session do
    company = company_fixture(%{name: "Test Org"})
    session = session |> UI.login()
    champion = UI.get_account().person
    project = create_project(company, champion)

    {:ok, %{session: session, company: company, champion: champion, project: project}}
  end

  feature "submitting a status update", state do
    state
    |> visit_page(state.project)
    |> UI.click(testid: "add-status-update")
    |> UI.fill_rich_text("This is a status update.")
    |> UI.click(testid: "post-status-update")
    |> assert_has(Query.text("This is a status update."))
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
