defmodule Operately.Features.ProjectReviewsTest do
  use Operately.FeatureCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  setup session do
    company = company_fixture(%{name: "Test Org"})
    session = session |> UI.login()
    champion = UI.get_account().person
    project = create_project(company, champion)

    {:ok, %{session: session, company: company, champion: champion, project: project}}
  end

  feature "request a review", state do
    champion = person_fixture(%{full_name: "John Wick", title: "Head of Operations", company_id: state.company.id})
    reviewer = state.champion

    change_champion(state.project, champion)
    change_reviewer(state.project, reviewer)

    state
    |> visit_page(state.project)
    |> UI.click(testid: "request-review-button")
    |> UI.fill_rich_text("The project was paused for a while, let's review it before we continue.")
    |> UI.click(testid: "request-review-submit-button")
    |> UI.assert_text("Review requested by #{reviewer.full_name}")
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

  defp add_contributor(project, person, role, responsibility \\ " ") do
    {:ok, _} = Operately.Projects.create_contributor(%{
      person_id: person.id, 
      role: role, 
      project_id: project.id, 
      responsibility: responsibility
    })
  end

  defp change_champion(project, champion) do
    delete_contributors_with_role(project, "champion")
    add_contributor(project, champion, "champion")
  end

  defp change_reviewer(project, reviewer) do
    delete_contributors_with_role(project, "reviewer")
    add_contributor(project, reviewer, "reviewer")
  end

  defp delete_contributors_with_role(project, role) do
    Operately.Projects.list_project_contributors(project)
    |> Enum.filter(fn contributor -> contributor.role == role end)
    |> Enum.map(&Operately.Projects.delete_contributor(&1))
  end
end
