defmodule OperatelyWeb.Api.Mutations.CopyResourceHubFolder do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Paths
  alias Operately.Operations.ResourceHubFolderCopying
  alias Operately.ResourceHubs.{Permissions, ResourceHub, Folder}

  inputs do
    field :folder_id, :id
    field :dest_resource_hub_id, :id
    field :dest_parent_folder_id, :id
  end

  outputs do
    field :folder_id, :id
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:folder, fn ctx -> load_folder(ctx.me, inputs.folder_id) end)
    |> run(:resource_hub, fn ctx -> load_resource_hub(ctx.me, inputs.dest_resource_hub_id) end)
    |> run(:folder_permissions, fn ctx -> Permissions.check(ctx.folder.request_info.access_level, :can_copy_folder) end)
    |> run(:resource_hub_permissions, fn ctx -> Permissions.check(ctx.resource_hub.request_info.access_level, :can_copy_folder) end)
    |> run(:operation, fn ctx -> execute(ctx, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{folder_id: Paths.folder_id(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :folder, _} -> {:error, :not_found}
      {:error, :resource_hub, _} -> {:error, :not_found}
      {:error, :folder_permissions, _} -> {:error, :forbidden}
      {:error, :resource_hub_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load_folder(person, id) do
    Folder.get(person, id: id, opts: [preload: [:node, :resource_hub]])
  end

  defp load_resource_hub(person, id) do
    ResourceHub.get(person, id: id)
  end

  defp execute(ctx, inputs) do
    ResourceHubFolderCopying.run(ctx.me, ctx.folder, ctx.resource_hub, inputs.dest_parent_folder_id)
  end
end
