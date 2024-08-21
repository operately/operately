defmodule OperatelyWeb.Api.Mutations.UpdateGroupAppearance do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions

  inputs do
    field :id, :string
    field :icon, :string
    field :color, :string
  end

  outputs do
    field :space, :space
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:inputs, fn -> parse_inputs(inputs) end)
    |> run(:space, fn ctx -> Groups.get_group_with_access_level(ctx.inputs.id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.requester_access_level, :can_edit) end)
    |> run(:operation, fn ctx -> update_group(ctx.space, ctx.inputs.icon, ctx.inputs.color) end)
    |> run(:serialized, fn ctx -> {:ok, %{space: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def parse_inputs(inputs) do
    case decode_id(inputs.id) do
      {:ok, id} -> {:ok, Map.put(inputs, :id, id)}
      {:error, _} -> {:error, :bad_request}
    end
  end

  def update_group(group, icon, color) do
    Operately.Groups.update_group(group, %{icon: icon, color: color})
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :inputs, _} -> {:error, :bad_request}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end 
end
