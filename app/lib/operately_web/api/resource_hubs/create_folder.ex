defmodule OperatelyWeb.Api.ResourceHubs.CreateFolder do
  @moduledoc """
  Creates a new folder in a resource hub.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.ResourceHubFolderCreating
  alias Operately.ResourceHubs.{Permissions, ResourceHub}

  inputs do
    field :resource_hub_id, :id, null: false
    field? :folder_id, :id, null: true
    field :name, :string, null: false
  end

  outputs do
    field :folder, :resource_hub_folder, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:hub, fn ctx -> ResourceHub.get(ctx.me, id: ctx.attrs.resource_hub_id) end)
    |> run(:permissions, fn ctx -> authorize(ctx.hub, company_read_only(conn)) end)
    |> run(:operation, fn ctx -> execute(ctx) end)
    |> run(:serialized, fn ctx -> serialize(ctx) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :hub, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, Map.merge(inputs, %{
      parent_folder_id: inputs[:folder_id],
    })}
  end

  defp authorize(hub, company_read_only) do
    Permissions.check(hub.request_info.access_level, :can_create_folder, company_read_only: company_read_only)
  end

  defp execute(ctx) do
    ResourceHubFolderCreating.run(ctx.me, ctx.hub, ctx.attrs)
  end

  defp serialize(ctx) do
    {:ok, %{folder: Serializer.serialize(ctx.operation)}}
  end
end
