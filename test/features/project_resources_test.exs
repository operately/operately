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

  # @tag login_as: :champion
  # feature "listing key resources", ctx do
  #   add_key_resource(ctx.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})
  #   add_key_resource(ctx.project, %{title: "Website", link: "https://operately.com", type: "generic"})

  #   ctx
  #   |> visit_show(ctx.project)
  #   |> UI.assert_has(Query.text("Code Repository"))
  #   |> UI.assert_has(Query.text("Website"))
  # end

  # @tag login_as: :champion
  # feature "adding key resources to a project", ctx do
  #   ctx
  #   |> visit_show(ctx.project)
  #   |> UI.click(testid: "add-key-resource")
  #   |> UI.fill("Title", with: "Code Repository")
  #   |> UI.fill("URL", with: "https://github.com/operately/operately")
  #   |> UI.click(testid: "save-key-resource")
  #   |> UI.assert_has(Query.text("Code Repository"))
  # end

  # @tag login_as: :champion
  # feature "editing key resources on a project", ctx do
  #   add_key_resource(ctx.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})

  #   ctx
  #   |> visit_show(ctx.project)
  #   |> UI.assert_has(Query.text("Code Repository"))
  #   |> UI.click(testid: "key-resource-options")
  #   |> UI.click(testid: "edit-key-resource")
  #   |> UI.fill("Title", with: "Github Repository")
  #   |> UI.fill("URL", with: "https://github.com/operately/kpiexamples")
  #   |> UI.refute_has(Query.text("Github Repository"))
  # end

  # @tag login_as: :champion
  # feature "removing key resources from a project", ctx do
  #   add_key_resource(ctx.project, %{title: "Code Repository", link: "https://github.com/operately/operately", type: "github"})

  #   ctx
  #   |> visit_show(ctx.project)
  #   |> UI.assert_has(Query.text("Code Repository"))
  #   |> UI.click(testid: "key-resource-options")
  #   |> UI.click(testid: "remove-key-resource")

  #   ctx
  #   |> visit_show(ctx.project)
  #   |> UI.refute_has(Query.text("Code Repository"))
  # end
end
