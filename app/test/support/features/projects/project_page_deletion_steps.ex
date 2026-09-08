defmodule Operately.Support.Features.Projects.ProjectPageDeletionSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps

  def setup(ctx) do
    ctx
    |> ProjectSteps.create_project(name: "Project to delete")
    |> ProjectSteps.setup_contributors()
    |> ProjectSteps.login()
  end

  step :visit_project_page, ctx do
    ProjectSteps.visit_project_page(ctx)
  end

  step :delete_project, ctx do
    ctx
    |> UI.find(UI.query(testid: "actions-section"), fn actions ->
      UI.click(actions, Wallaby.Query.css("span", text: "Delete"))
    end)
    |> UI.click(testid: "delete")
  end

  step :assert_project_deleted, ctx do
    ctx = UI.assert_location(ctx, Paths.space_work_map_path(ctx.company, ctx.group) <> "?tab=projects")
    assert Operately.Repo.reload(ctx.project) == nil
    ctx
  end
end
