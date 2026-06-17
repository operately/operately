defmodule OperatelyWeb.Api.ResourceHubs.CopyFolder do
  @moduledoc """
  Copies a folder within Docs & Files.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.ResourceHubFolderCopying
  alias Operately.ResourceHubs.{Folder, Permissions, ResourceHub}
  alias OperatelyWeb.Paths

  inputs do
    field? :folder_name, :string, null: false
    field :folder_id, :id, null: false
    field? :dest_parent_folder_id, :id, null: true
  end

  outputs do
    field :folder_id, :id, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:folder, fn ctx -> load_folder(ctx.me, inputs.folder_id) end)
    |> run(:resource_hub, fn ctx -> load_resource_hub(ctx.me, ctx.folder) end)
    |> run(:folder_permissions, fn ctx -> Permissions.check(ctx.folder.request_info.access_level, :can_copy_folder, company_read_only: company_read_only(conn)) end)
    |> run(:resource_hub_permissions, fn ctx -> Permissions.check(ctx.resource_hub.request_info.access_level, :can_copy_folder, company_read_only: company_read_only(conn)) end)
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

  defp load_resource_hub(person, folder) do
    ResourceHub.get(person, id: folder.resource_hub.id)
  end

  defp execute(ctx, inputs) do
    ResourceHubFolderCopying.run(ctx.me, ctx.folder, ctx.resource_hub, %{
      name: inputs[:folder_name],
      parent_folder_id: inputs[:dest_parent_folder_id],
    })
  end
end
