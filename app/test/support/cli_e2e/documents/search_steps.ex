defmodule Operately.Support.CliE2E.Documents.SearchSteps do
  use Operately.Support.CliE2E

  alias Operately.Search.SourceIndexer
  alias Operately.Support.CliE2E.Documents.HubScopeSteps
  alias Operately.Support.RichText
  alias OperatelyWeb.Paths

  @search_query "scoped cli search evidence"

  step :setup, ctx do
    ctx =
      ctx
      |> HubScopeSteps.setup_base()
      |> Factory.add_document(:space_document, :resource_hub,
        name: "Space search document",
        content: RichText.rich_text("Distinctive #{@search_query}")
      )

    index_document!(ctx.space_document)

    ctx
    |> Map.put(:expected_document_id, Paths.document_id(ctx.space_document))
    |> Map.put(:expected_document_name, "Space search document")
  end

  step :setup_project, ctx do
    ctx =
      ctx
      |> HubScopeSteps.init_project_scope()
      |> Factory.add_document(:project_document, :project_hub,
        name: "Project search document",
        content: RichText.rich_text("Distinctive #{@search_query}")
      )

    index_document!(ctx.project_document)

    ctx
    |> Map.put(:expected_document_id, Paths.document_id(ctx.project_document))
    |> Map.put(:expected_document_name, "Project search document")
  end

  step :setup_goal, ctx do
    ctx =
      ctx
      |> HubScopeSteps.init_goal_scope()
      |> Factory.add_document(:goal_document, :goal_hub,
        name: "Goal search document",
        content: RichText.rich_text("Distinctive #{@search_query}")
      )

    index_document!(ctx.goal_document)

    ctx
    |> Map.put(:expected_document_id, Paths.document_id(ctx.goal_document))
    |> Map.put(:expected_document_name, "Goal search document")
  end

  step :search, ctx do
    result =
      run_cli(ctx, [
        "documents",
        "search",
        "--query",
        @search_query
        | HubScopeSteps.hub_scope_flag(ctx)
      ])

    Map.put(ctx, :cli_result, result)
  end

  step :assert_document_found, ctx do
    HubScopeSteps.assert_cli_success!(ctx)

    nodes = HubScopeSteps.cli_payload(ctx)["nodes"] || []

    assert Enum.any?(nodes, fn node ->
             node["document"] &&
               node["document"]["id"] == ctx.expected_document_id &&
               node["name"] == ctx.expected_document_name
           end)

    ctx
  end

  defp index_document!(document) do
    assert {:ok, _} = SourceIndexer.sync("resource_hub_document", document.id)
  end
end
