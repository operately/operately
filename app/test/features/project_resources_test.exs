defmodule Operately.Features.ProjectResourcesTest do
  use Operately.FeatureCase

  alias Operately.ResourceHubs.ProjectHub
  alias Operately.ResourceHubsFixtures
  alias Operately.Support.Features.ProjectSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "listing docs and files on the project dashboard", ctx do
    ctx
    |> add_project_link("Code Repository", "https://github.com/operately/operately")
    |> add_project_link("Website", "https://operately.com")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_has(testid: "docs-and-files-preview")
    |> UI.assert_text("Code Repository")
    |> UI.assert_text("Website")
  end

  @tag login_as: :champion
  feature "adding a link to project docs and files", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "tab-docs & files")
    |> add_link_from_docs_and_files_tab("Project Brief", "https://operately.com/project-brief")
    |> UI.assert_text("Project Brief")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("Project Brief")
  end

  #
  # Helpers
  #

  defp add_project_link(ctx, title, url) do
    hub = ProjectHub.get_project_hub(ctx.project.id)

    ResourceHubsFixtures.link_fixture(hub, ctx.champion, %{
      name: title,
      url: url
    })

    ctx
  end

  defp add_link_from_docs_and_files_tab(ctx, title, url) do
    ctx
    |> UI.click(testid: "add-options")
    |> UI.click(testid: "add-link")
    |> UI.click(testid: "link-to-other-resource")
    |> UI.fill(testid: "title", with: title)
    |> UI.fill(testid: "link", with: url)
    |> UI.click(testid: "submit")
    |> UI.refute_has(testid: "submit")
  end
end
