defmodule OperatelyWeb.Api.ExternalQueries.Queries.ResourceHubs.ListDrafts do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def query_name, do: "resource_hubs/list_drafts"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.fetch_default_resource_hub(:hub, :space)
    |> Factory.add_folder(:folder, :hub)
    |> Factory.add_document(:draft, :hub, folder: :folder, state: :draft)
    |> Factory.add_document(:published, :hub)
    |> Factory.add_company_member(:other)
    |> Factory.add_document(:other_draft, :hub, author: :other, state: :draft)
  end

  @impl true
  def inputs(ctx), do: %{resource_hub_id: Paths.resource_hub_id(ctx.hub)}

  @impl true
  def assert(response, ctx) do
    assert [draft] = response.draft_nodes
    assert draft.document.id == Paths.document_id(ctx.draft)
    assert Enum.map(draft.path_to_node, & &1.id) == [Paths.folder_id(ctx.folder)]
  end
end
