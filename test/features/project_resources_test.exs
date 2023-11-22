defmodule Operately.Features.ProjectResourcesTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "listing key resources on the project dashboard", ctx do
    ctx
    |> add_key_resource("Code Repository", "https://github.com/operately/operately", "github-repository")
    |> add_key_resource("Website", "https://operately.com", "generic")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("Code Repository")
    |> UI.assert_text("Website")
  end

  @tag login_as: :champion
  feature "adding first key resource to a project", ctx do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "add-resources-link")
    |> UI.click(testid: "add-resource-github-repository")
    |> UI.fill("Name", with: "Code Repository")
    |> UI.fill("URL", with: "https://github.com/operately/operately")
    |> UI.click(testid: "save")
    |> UI.assert_text("Code Repository")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("Code Repository")
  end

  @tag login_as: :champion
  feature "adding non-first key resource to a project", ctx do
    ctx
    |> add_key_resource("Code Repository", "https://github.com/operately/operately", "github-repository")
    |> add_key_resource("Website", "https://operately.com", "generic")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "edit-resources-link")
    |> UI.click(testid: "add-resource-slack-channel")
    |> UI.fill("Name", with: "#product")
    |> UI.fill("URL", with: "https://operately.slack.com")
    |> UI.click(testid: "save")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("#product")
  end

  @tag login_as: :champion
  feature "removing a key resource from a project", ctx do
    ctx
    |> add_key_resource("Code Repository", "https://github.com/operately/operately", "github-repository")
    |> add_key_resource("Website", "https://operately.com", "generic")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "edit-resources-link")
    |> UI.click(testid: "remove-resource-website")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("Code Repository")
    |> UI.refute_text("Website")
  end

  @tag login_as: :champion
  feature "editing a key resource", ctx do
    ctx
    |> add_key_resource("Code Repository", "https://github.com/operately/operately", "github-repository")
    |> add_key_resource("Website", "https://operately.com", "generic")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "edit-resources-link")
    |> UI.click(testid: "edit-resource-code-repository")
    |> UI.fill("Name", with: "Operately Repo")
    |> UI.fill("URL", with: "https://github.com/operately/operately")
    |> UI.click(testid: "save")

    ctx
    |> UI.refute_text("Code Repository")
    |> UI.assert_text("Operately Repo")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_text("Operately Repo")
    |> UI.refute_text("Code Repository")
    |> UI.assert_text("Website")
  end

  #
  # Helpers
  #

  defp add_key_resource(ctx, title, link, resource_type) do
    attrs = %{
      project_id: ctx.project.id,
      title: title,
      link: link,
      resource_type: resource_type
    }

    {:ok, _} = Operately.Projects.create_key_resource(attrs)
    ctx
  end
end
