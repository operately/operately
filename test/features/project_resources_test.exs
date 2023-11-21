defmodule Operately.Features.ProjectResourcesTest do
  use Operately.FeatureCase

  import Operately.PeopleFixtures
  import Operately.UpdatesFixtures

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "listing key resources", ctx do
    ctx
    |> add_key_resource("Code Repository", "https://github.com/operately/operately", "github-repository")
    |> add_key_resource("Website", "https://operately.com", "generic")

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_has(Query.text("Code Repository"))
    |> UI.assert_has(Query.text("Website"))
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
    |> UI.assert_has(Query.text("Code Repository"))

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_has(Query.text("Code Repository"))
  end

  @tag login_as: :champion
  feature "editing key resources on a project", ctx do
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
    |> UI.click(testid: "remove-resource-website")
    |> UI.assert_has(Query.text("Code Repository"))

    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.assert_has(Query.text("Code Repository"))
    |> UI.assert_has(Query.text("#product"))
    |> UI.refute_has(Query.text("Website"))
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
