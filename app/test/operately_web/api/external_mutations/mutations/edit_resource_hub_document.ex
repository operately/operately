defmodule OperatelyWeb.Api.ExternalMutations.Mutations.EditResourceHubDocument do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "edit_resource_hub_document"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_document(:document, :resource_hub)
  end

  @impl true
  def inputs(ctx) do
    %{
      document_id: Paths.document_id(ctx.document),
      name: "Updated Name",
      content: rich_text_string("Updated content")
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.document.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
