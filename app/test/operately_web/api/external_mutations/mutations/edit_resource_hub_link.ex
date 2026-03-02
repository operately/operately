defmodule OperatelyWeb.Api.ExternalMutations.Mutations.EditResourceHubLink do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "edit_resource_hub_link"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_link(:link, :resource_hub)
  end

  @impl true
  def inputs(ctx) do
    %{
      link_id: Paths.link_id(ctx.link),
      name: "Updated Name",
      url: "https://example.com",
      description: rich_text_string("Updated content"),
      type: "other"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.link.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
