defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.CompaniesFixtures

  setup session do
    company = company_fixture(%{name: "Test Org"})
    person = person_fixture(%{name: "Test User", company_id: company.id})

    session = session |> UI.login()

    {:ok, %{session: session, company: company.id, person: person}}
  end

  feature "listing projects", state do
    project = project_fixture(%{
      name: "Live support", 
      company_id: state.company, 
      creator_id: state.person.id
    })

    state
    |> visit_page()
    |> assert_has(Query.text(project.name))
  end

  # feature "creating a new project", state do
  #   project = "Live support"

  #   state
  #   |> click_new_project()
  #   |> set_name(project)
  #   |> save()
  #   |> assert_project_is_in_the_list(project)
  # end

  # # ===========================================================================

  defp visit_page(state) do
    UI.visit(state, "/projects")
  end

  # def click_new_project(state) do
  #   UI.click_link(state, "New Project")
  # end

  # def save(state) do
  #   state
  #   |> UI.click_button("Save")
  #   |> UI.wait_for_page_to_load("/projects")
  # end

  # def set_name(state, name) do
  #   UI.fill(state, "Name", with: name)
  # end

  # def assert_project_is_in_the_list(state, project) do
  #   UI.assert_text(state, project)
  # end
end
