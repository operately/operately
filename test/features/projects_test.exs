defmodule Operately.Features.ProjectsTest do
  use Operately.FeatureCase

  setup session do
    session = session |> UI.login() |> visit_page()

    {:ok, %{session: session}}
  end

  feature "creating a new project", state do
    project = "Live support"

    state
    |> click_new_project()
    |> set_name(project)
    |> save()
    |> assert_project_is_in_the_list(project)
  end

  # ===========================================================================

  defp visit_page(state) do
    UI.visit(state, "/projects")
  end

  def click_new_project(state) do
    UI.click_link(state, "New Project")
  end

  def save(state) do
    state
    |> UI.click_button("Save")
    |> UI.wait_for_page_to_load("/projects")
  end

  def set_name(state, name) do
    UI.fill(state, "Name", with: name)
  end

  def assert_project_is_in_the_list(state, project) do
    UI.assert_text(state, project)
  end
end
