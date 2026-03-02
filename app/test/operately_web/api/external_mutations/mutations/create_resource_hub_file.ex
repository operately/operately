defmodule OperatelyWeb.Api.ExternalMutations.Mutations.CreateResourceHubFile do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "create_resource_hub_file"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_blob(:blob)
  end

  @impl true
  def inputs(ctx) do
    %{
      resource_hub_id: Paths.resource_hub_id(ctx.resource_hub),
      files: [%{blob_id: ctx.blob.id, name: "file.txt", description: rich_text_string("Updated file")}]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.files
    assert is_list(response.files)
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
