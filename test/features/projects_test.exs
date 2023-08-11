defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase

  import Operately.ProjectsFixtures
  import Operately.CompaniesFixtures

  @project_description """
  SuperPace is an innovative project designed to track and quantify DevOps
  TEXT START MARKER <- this is the start of the text
  Research and Assessment (DORA) metrics for organizations across the globe. The
  project's primary goal is to empower development and operations teams by
  providing insightful, actionable data to drive performance and productivity
  improvements.

  DORA includes some fancy stuff that is mentioned in this line

  SuperPace will do something called Y, instead of X

  SuperPace utilizes cutting-edge data collection and analytics technologies to
  meticulously gather, measure, and interpret key DORA metrics, including
  deployment frequency, lead time for changes, time to restore service, and
  change failure rate. By translating these metrics into practical insights,
  SuperPace fosters continuous learning, enhances collaboration, and accelerates
  the pace of innovation in the complex, fast-paced world.
  TEXT END MARKER <- this is the end of the text
  """

  setup session do
    company = company_fixture(%{name: "Test Org"})
    session = session |> UI.login()

    champion = UI.get_account().person
    project = project_fixture(%{name: "Live support", company_id: company.id, creator_id: champion.id})
    
    {:ok, _} = Operately.Projects.create_contributor(%{
      project_id: project.id,
      person_id: champion.id,
      role: "champion"
    })

    {:ok, %{session: session, company: company.id, champion: champion, project: project}}
  end

  feature "listing projects", state do
    state
    |> visit_index()
    |> assert_has(Query.text(state.project.name))
  end

  feature "editing the project description", state do
    state
    |> visit_show(state.project)
    |> click_write_description()
    |> UI.fill_rich_text(@project_description)
    |> click_save()

    # by default only the top of text is visible
    state.session
    |> assert_has(Query.text("TEXT START MARKER"))
    |> refute_has(Query.text("TEXT END MARKER"))

    # the text can be expanded
    state.session
    |> expand_description()
    |> assert_has(Query.text("TEXT END MARKER"))
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

  defp visit_index(state) do
    UI.visit(state, "/projects")
  end

  defp visit_show(state, project) do
    UI.visit(state, "/projects" <> "/" <> project.id)
  end

  def click_write_description(state) do
    UI.click(state, testid: "write-project-description")
  end

  def expand_description(state) do
    UI.click(state, testid: "expand-project-description")
  end

  def click_save(state) do
    click(state, Query.button("Save"))
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
