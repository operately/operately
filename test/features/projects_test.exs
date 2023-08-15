defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase

  import Operately.ProjectsFixtures
  import Operately.CompaniesFixtures

  setup session do
    company = company_fixture(%{name: "Test Org"})
    session = session |> UI.login()
    champion = UI.get_account().person
    project = create_project(company, champion)

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
    |> UI.fill_rich_text(project_description())
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

  feature "listing key resources", state do
    add_key_resource(state.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})
    add_key_resource(state.project, %{title: "Website", link: "https://operately.com", type: "generic"})

    state
    |> visit_show(state.project)
    |> assert_has(Query.text("Key Resources"))
    |> assert_has(Query.text("Code Repository"))
    |> assert_has(Query.text("Website"))
  end

  feature "adding key resources to a project", state do
    state
    |> visit_show(state.project)
    |> UI.click(testid: "add-key-resource")
    |> UI.fill("Title", with: "Code Repository")
    |> UI.fill("URL", with: "https://github.com/operately/operately")
    |> UI.click(testid: "save-key-resource")
    |> assert_has(Query.text("Code Repository"))
  end

  feature "editing key resources on a project", state do
    add_key_resource(state.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})

    state
    |> visit_show(state.project)
    |> assert_has(Query.text("Code Repository"))
    |> UI.click(testid: "key-resource-options")
    |> UI.click(testid: "edit-key-resource")
    |> UI.fill("Title", with: "Github Repository")
    |> UI.fill("URL", with: "https://github.com/operately/kpiexamples")
    |> refute_has(Query.text("Github Repository"))
  end

  feature "removing key resources from a project", state do
    add_key_resource(state.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})

    state
    |> visit_show(state.project)
    |> assert_has(Query.text("Code Repository"))
    |> UI.click(testid: "key-resource-options")
    |> UI.click(testid: "remove-key-resource")
    |> refute_has(Query.text("Code Repository"))
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

  def add_key_resource(project, attrs) do
    {:ok, _} = Operately.Projects.create_key_resource(%{project_id: project.id} |> Map.merge(attrs))
  end

  defp create_project(company, champion) do
    project = project_fixture(%{name: "Live support", company_id: company.id, creator_id: champion.id})

    {:ok, _} = Operately.Projects.create_contributor(%{
      project_id: project.id,
      person_id: champion.id,
      role: "champion"
    })
    
    project
  end

  defp project_description() do
    """
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
