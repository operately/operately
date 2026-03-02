defmodule OperatelyWeb.Api.ExternalMutations.Mutations.EditParentFolderInResourceHub do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "edit_parent_folder_in_resource_hub"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_file(:file, :resource_hub)
    |> Factory.add_folder(:folder, :resource_hub)
  end

  @impl true
  def inputs(ctx) do
    %{
      resource_id: Paths.file_id(ctx.file),
      resource_type: "file",
      new_folder_id: Paths.folder_id(ctx.folder)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
