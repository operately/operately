defmodule Operately.Support.Features.CompanySearchSteps do
  use Operately.FeatureCase

  alias Operately.Projects.Project
  alias Operately.Search.SourceIndexer
  alias Operately.Support.RichText
  alias OperatelyWeb.Paths

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Product")
    |> Factory.add_project(:website, :space, name: "Website redesign")
    |> Factory.add_project(:portal, :space, name: "Customer portal")
    |> set_project_description(:website, "Customer interviews show that the approval workflow needs to be simpler.")
    |> set_project_description(:portal, "Renewal evidence supports a clearer customer portal.")
    |> index_project(:website)
    |> index_project(:portal)
    |> Factory.log_in_person(:creator)
  end

  step :visit_search_page, ctx do
    UI.visit(ctx, Paths.search_path(ctx.company))
  end

  step :visit_search_page, ctx, query do
    UI.visit(ctx, Paths.search_path(ctx.company, query))
  end

  step :assert_search_query, ctx, query do
    UI.assert_has(ctx, testid: "company-search-input", value: query)
  end

  step :assert_initial_state, ctx do
    UI.assert_text(ctx, "Search across projects, goals, discussions, documents, and more.")
  end

  step :search_for, ctx, query do
    ctx
    |> UI.fill(testid: "company-search-input", with: query)
    |> UI.sleep(500)
  end

  step :assert_search_location, ctx, query do
    UI.assert_location(ctx, Paths.search_path(ctx.company, query))
  end

  step :assert_project_result, ctx, project_name do
    ctx
    |> UI.wait_until_text(project_name)
    |> UI.assert_has(testid: "company-search-result")
  end

  step :assert_body_match_metadata, ctx do
    ctx
    |> UI.assert_text("Project · Product")
    |> UI.assert_text("Matched in description")
    |> UI.assert_text("approval workflow")
  end

  step :open_project_result, ctx do
    UI.click(ctx, testid: "company-search-result")
  end

  step :assert_project_page, ctx do
    project_path =
      Paths.create_path([
        Paths.company_id(ctx.company),
        "projects",
        Operately.ShortUuid.encode!(ctx.website.id)
      ])

    ctx
    |> UI.assert_page(project_path)
    |> UI.wait_until_has(testid: "project-page")
    |> UI.wait_until_text(ctx.website.name, testid: "project-page")
  end

  defp set_project_description(ctx, project_name, description) do
    project =
      ctx
      |> Map.fetch!(project_name)
      |> Project.changeset(%{description: RichText.rich_text(description)})
      |> Repo.update!()

    Map.put(ctx, project_name, project)
  end

  defp index_project(ctx, project_name) do
    project = Map.fetch!(ctx, project_name)
    assert {:ok, _summary} = SourceIndexer.sync("project", project.id)
    ctx
  end
end
