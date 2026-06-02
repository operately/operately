defmodule OperatelyWeb.Api.Files.Update do
  @moduledoc """
  Updates a file.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{File, Permissions}
  alias Operately.Operations.ResourceHubFileEditing

  inputs do
    field :file_id, :id, null: false
    field :name, :string, null: false
    field? :description, :json, null: false
  end

  outputs do
    field :file, :resource_hub_file, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:file, fn ctx -> find_file(ctx, inputs) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.file.request_info.access_level, :can_edit_file, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> ResourceHubFileEditing.run(ctx.me, ctx.file, inputs) end)
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

  defp find_file(ctx, inputs) do
    File.get(ctx.me, id: inputs.file_id, opts: [preload: [:node, :resource_hub]])
  end
end
