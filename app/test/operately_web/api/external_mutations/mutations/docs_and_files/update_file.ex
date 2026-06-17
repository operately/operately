defmodule OperatelyWeb.Api.ExternalMutations.Mutations.DocsAndFiles.UpdateFile do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Support.RichText

  @impl true
  def mutation_name, do: "docs_and_files/update_file"

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
      name: "Updated file.pdf",
      description: RichText.rich_text("Updated file description", :as_string)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.file.id
    assert response.file.name == "Updated file.pdf"
    refute Map.has_key?(response, :error)
  end
end
