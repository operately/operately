defmodule OperatelyWeb.Api.Mutations.DeleteResourceHubFile do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{File, Permissions}
  alias Operately.Operations.ResourceHubFileDeleting

  inputs do
    field :file_id, :id
  end

  outputs do
    field :file, :resource_hub_file
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:file, fn ctx -> find_file(ctx.me, inputs) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.file.request_info.access_level, :can_delete_file) end)
    |> run(:operation, fn ctx -> ResourceHubFileDeleting.run(ctx.me, ctx.file) end)
    |> run(:serialized, fn ctx -> {:ok, %{file: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :file, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp find_file(me, inputs) do
    File.get(me, id: inputs.file_id, opts: [preload: [:node, :resource_hub]])
  end
end
