defmodule OperatelyWeb.Api.Mutations.CreateResourceHubFolder do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{ResourceHub, Permissions}
  alias Operately.Operations.ResourceHubFolderCreating

  inputs do
    field :resource_hub_id, :string
    field :folder_id, :string
    field :name, :string
    field :description, :string
  end

  outputs do
    field :folder, :resource_hub_folder
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:hub, fn ctx -> find_resource(ctx) end)
    |> run(:permissions, fn ctx -> authorize(ctx.hub) end)
    |> run(:operation, fn ctx -> execute(ctx) end)
    |> run(:serialized, fn ctx -> serialize(ctx) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :hub, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, resource_hub_id} = decode_id(inputs.resource_hub_id)
    {:ok, folder_id} = decode_id(inputs[:folder_id], :allow_nil)

    {:ok, Map.merge(inputs, %{
      resource_hub_id: resource_hub_id,
      parent_folder_id: folder_id,
      description: Jason.decode!(inputs.description),
    })}
  end

  defp find_resource(ctx) do
    ResourceHub.get(ctx.me, id: ctx.attrs.resource_hub_id)
  end

  defp authorize(hub) do
    Permissions.check(hub.request_info.access_level, :can_create_folder)
  end

  defp execute(ctx) do
    ResourceHubFolderCreating.run(ctx.me, ctx.hub, ctx.attrs)
  end

  defp serialize(ctx) do
    {:ok, %{folder: Serializer.serialize(ctx.operation)}}
  end
end
