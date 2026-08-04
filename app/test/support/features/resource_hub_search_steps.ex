defmodule Operately.Support.Features.ResourceHubSearchSteps do
  use Operately.FeatureCase

  alias Operately.ResourceHubs.Folder
  alias Operately.Search.SourceIndexer
  alias Operately.Support.RichText
  alias Operately.Support.Features.UI
  alias OperatelyWeb.Paths

  step :setup, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Research")
    |> Factory.add_resource_hub(:hub, :space, :creator, name: "Knowledge Base")
    |> Factory.add_folder(:folder, :hub)
    |> rename_folder("Customer research")
    |> Factory.add_document(:document, :hub,
      folder: :folder,
      name: "Enterprise research synthesis",
      content: RichText.rich_text("Customer interviews showed that the approval workflow needs to be simpler.")
    )
    |> index_document()
    |> Factory.log_in_person(:creator)
  end

  step :visit_resource_hub, ctx do
    UI.visit(ctx, Paths.resource_hub_path(ctx.company, ctx.hub))
  end

  step :search_for, ctx, query do
    ctx
    |> UI.fill(testid: "resource-hub-search", with: query)
    |> UI.sleep(500)
  end

  step :assert_document_result, ctx do
    ctx
    |> UI.assert_has(testid: "resource-hub-search-result-0")
    |> UI.assert_text("Enterprise research synthesis")
  end

  step :open_document_result, ctx do
    UI.click(ctx, testid: "resource-hub-search-result-0")
  end

  step :assert_document_page, ctx do
    UI.assert_page(ctx, Paths.document_path(ctx.company, ctx.document))
  end

  defp rename_folder(ctx, name) do
    folder =
      ctx.folder
      |> Folder.changeset(%{name: name})
      |> Repo.update!()

    Map.put(ctx, :folder, folder)
  end

  defp index_document(ctx) do
    assert {:ok, _summary} = SourceIndexer.sync("resource_hub_document", ctx.document.id)
    ctx
  end
end
