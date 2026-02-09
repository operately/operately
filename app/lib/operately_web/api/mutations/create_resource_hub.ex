defmodule OperatelyWeb.Api.Mutations.CreateResourceHub do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.{Group, Permissions}
  alias Operately.Operations.ResourceHubCreating

  inputs do
    field? :space_id, :string, null: true
    field? :name, :string, null: true
    field? :description, :string, null: true
    field? :anonymous_access_level, :integer, null: true
    field? :company_access_level, :integer, null: true
    field? :space_access_level, :integer, null: true
  end

  outputs do
    field? :resource_hub, :resource_hub, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:space, fn ctx -> Group.get(ctx.me, id: ctx.attrs.id) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_edit) end)
    |> run(:operation, fn ctx -> ResourceHubCreating.run(ctx.me, ctx.space, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{resource_hub: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, id} = decode_id(inputs.space_id)
    description = inputs[:description] && Jason.decode!(inputs.description)

    {:ok, Map.merge(inputs, %{id: id, description: description})}
  end
end
