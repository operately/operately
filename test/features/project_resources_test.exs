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
    |> ProjectSteps.add_link_as_key_resource()
    |> ProjectSteps.assert_new_key_resource_visible()
    |> ProjectSteps.visit_project_page()
    |> ProjectSteps.assert_new_key_resource_visible()
    |> ProjectSteps.assert_project_key_resource_added_visible_on_feed()
    |> ProjectSteps.assert_key_resource_added_notification_sent()
    |> ProjectSteps.assert_key_resource_email_sent()
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
    |> UI.fill(label: "Name", with: "#product")
    |> UI.fill(label: "URL", with: "https://operately.slack.com")
    |> UI.click(testid: "save")
    |> UI.sleep(300)

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
    |> ProjectSteps.delete_key_resource()
    |> ProjectSteps.assert_key_resource_deleted()
    |> ProjectSteps.visit_project_page()
    |> ProjectSteps.assert_project_key_resource_deleted_visible_on_feed()
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
    |> UI.fill(label: "Name", with: "Operately Repo")
    |> UI.fill(label: "URL", with: "https://github.com/operately/operately")
    |> UI.click(testid: "save")
    |> UI.assert_has(testid: "project-edit-resources-page")

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
