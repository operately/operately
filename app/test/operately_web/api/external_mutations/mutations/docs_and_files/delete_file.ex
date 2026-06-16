defmodule OperatelyWeb.Api.ExternalMutations.Mutations.DocsAndFiles.DeleteFile do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "docs_and_files/delete_file"

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
      file_id: Paths.file_id(ctx.file)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.file.id
    refute Map.has_key?(response, :error)
  end
end
