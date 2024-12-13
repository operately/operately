defmodule OperatelyWeb.Api.Mutations.EditParentFolderInResourceHub do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Folder, Document, File, Permissions}
  alias Operately.Operations.ResourceHubParentFolderEditing

  inputs do
    field :resource_id, :id
    field :resource_type, :string
    field :new_folder_id, :id
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:resource, fn ctx -> find_resource(ctx.me, inputs.resource_id, inputs.resource_type) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.resource.request_info.access_level, :can_edit_parent_folder) end)
    |> run(:operation, fn ctx -> ResourceHubParentFolderEditing.run(ctx.me, ctx.resource, inputs.new_folder_id) end)
    |> run(:result, fn -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.result}
      {:error, :resource, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp find_resource(me, id, "document") do
    Document.get(me, id: id, opts: [preload: [:node, :space]])
  end

  defp find_resource(me, id, "folder") do
    Folder.get(me, id: id, opts: [preload: [:node, :space]])
  end

  defp find_resource(me, id, "file") do
    File.get(me, id: id, opts: [preload: [:node, :space]])
  end
end
