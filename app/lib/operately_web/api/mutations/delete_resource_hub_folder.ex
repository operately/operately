defmodule OperatelyWeb.Api.Mutations.DeleteResourceHubFolder do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Folder, Permissions}
  alias Operately.Operations.ResourceHubFolderDeleting

  inputs do
    field :folder_id, :id
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:folder, fn ctx -> find_folder(ctx.me, inputs) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.folder.request_info.access_level, :can_delete_folder) end)
    |> run(:operation, fn ctx -> ResourceHubFolderDeleting.run(ctx.me, ctx.folder) end)
    |> run(:result, fn -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.result}
      {:error, :folder, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp find_folder(me, inputs) do
    Folder.get(me, id: inputs.folder_id, opts: [preload: [:node, :resource_hub]])
  end
end
