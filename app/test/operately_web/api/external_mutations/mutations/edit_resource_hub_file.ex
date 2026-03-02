defmodule OperatelyWeb.Api.ExternalMutations.Mutations.EditResourceHubFile do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "edit_resource_hub_file"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_file(:file, :resource_hub)
  end

  @impl true
  def inputs(ctx) do
    %{
      file_id: Paths.file_id(ctx.file),
      name: "Updated Name",
      description: rich_text_string("Updated content")
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.file.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
