defmodule Operately.Support.CliBackwardCompatibility.ResourceHubsSteps do
  @moduledoc """
  Steps for legacy `resource_hubs/*` external API routes.

  These routes are hidden from the CLI catalog (`catalog: false`) but remain
  routable on `/api/external/v1` for backward compatibility with CLI <= 1.6.0.
  """

  use OperatelyWeb.TurboCase

  import ExUnit.Assertions

  alias Operately.ResourceHubs
  alias Operately.ResourceHubs.File, as: ResourceHubFile
  alias Operately.ResourceHubs.Folder

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:resource_hub, :space, :creator)
    |> Factory.add_file(:hub_file, :resource_hub)
    |> Factory.add_api_token(:api_token, :creator, read_only: false)
  end

  def setup_folder(ctx) do
    ctx = Factory.add_folder(ctx, :folder, :resource_hub)

    Map.put(ctx, :folder_id, ctx.folder.id)
  end

  def get_resource_hub(ctx) do
    assert {200, payload} =
             external_query(ctx.conn, ctx.api_token, "resource_hubs/get", %{
               id: Paths.resource_hub_id(ctx.resource_hub)
             })

    assert payload.resource_hub.id
    assert payload.resource_hub.id == Paths.resource_hub_id(ctx.resource_hub)

    ctx
  end

  def create_folder(ctx) do
    assert {200, payload} =
             external_mutation(ctx.conn, ctx.api_token, "resource_hubs/create_folder", %{
               resource_hub_id: Paths.resource_hub_id(ctx.resource_hub),
               name: "CLI folder"
             })

    folder_payload = payload.folder

    assert folder_payload.id

    {:ok, folder_id} = OperatelyWeb.Api.Helpers.decode_id(folder_payload.id)
    folder = Repo.get!(Folder, folder_id)

    assert ResourceHubs.list_folders(ctx.resource_hub) |> Enum.any?(&(&1.id == folder_id))

    ctx
    |> Map.put(:folder, folder)
    |> Map.put(:folder_id, folder_id)
  end

  def get_folder(ctx) do
    assert {200, payload} =
             external_query(ctx.conn, ctx.api_token, "resource_hubs/get_folder", %{
               id: Paths.folder_id(ctx.folder)
             })

    assert payload.folder.id

    {:ok, folder_id} = OperatelyWeb.Api.Helpers.decode_id(payload.folder.id)
    assert folder_id == ctx.folder_id

    ctx
  end

  def list_nodes(ctx) do
    assert {200, payload} =
             external_query(ctx.conn, ctx.api_token, "resource_hubs/list_nodes", %{
               resource_hub_id: Paths.resource_hub_id(ctx.resource_hub)
             })

    assert is_list(payload.nodes)
    assert is_list(payload.draft_nodes)

    file_node =
      Enum.find(payload.nodes, fn node ->
        node[:file] && node.file.id == Paths.file_id(ctx.hub_file)
      end)

    assert file_node

    ctx
  end

  def rename_folder(ctx) do
    assert {200, payload} =
             external_mutation(ctx.conn, ctx.api_token, "resource_hubs/rename_folder", %{
               folder_id: Paths.folder_id(ctx.folder),
               new_name: "Renamed CLI folder"
             })

    assert payload.success

    folder = Repo.get!(Folder, ctx.folder_id) |> Repo.preload(:node)
    assert folder.node.name == "Renamed CLI folder"

    ctx
  end

  def copy_folder(ctx) do
    assert {200, payload} =
             external_mutation(ctx.conn, ctx.api_token, "resource_hubs/copy_folder", %{
               folder_id: Paths.folder_id(ctx.folder),
               folder_name: "Copied CLI folder"
             })

    assert payload.folder_id

    {:ok, copied_folder_id} = OperatelyWeb.Api.Helpers.decode_id(payload.folder_id)
    copied_folder = Repo.get!(Folder, copied_folder_id)

    assert copied_folder.id != ctx.folder_id
    assert ResourceHubs.list_folders(ctx.resource_hub) |> Enum.any?(&(&1.id == copied_folder_id))

    ctx
    |> Map.put(:copied_folder_id, copied_folder_id)
  end

  def update_parent_folder(ctx) do
    assert {200, payload} =
             external_mutation(ctx.conn, ctx.api_token, "resource_hubs/update_parent_folder", %{
               resource_id: Paths.file_id(ctx.hub_file),
               resource_type: "file",
               new_folder_id: Paths.folder_id(ctx.folder)
             })

    assert payload.success

    file =
      Repo.get!(ResourceHubFile, ctx.hub_file.id)
      |> Repo.preload(:node)

    assert file.node.parent_folder_id == ctx.folder_id

    ctx
  end

  def delete_folder(ctx) do
    assert {200, payload} =
             external_mutation(ctx.conn, ctx.api_token, "resource_hubs/delete_folder", %{
               folder_id: Paths.folder_id(ctx.folder)
             })

    assert payload.success
    refute Repo.get(Folder, ctx.folder_id)

    ctx
  end
end
