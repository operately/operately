defmodule OperatelyWeb.Api.Mutations.EditGroup do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions

  inputs do
    field :id, :string
    field :name, :string
    field :mission, :string
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
    |> run(:operation, fn ctx -> Groups.edit_group_name_and_purpose(ctx.me, ctx.space, ctx.inputs) end)
    |> respond()
  end

  def parse_inputs(inputs) do
    case decode_id(inputs.id) do
      {:ok, id} -> {:ok, Map.put(inputs, :id, id)}
      {:error, _} -> {:error, :bad_request}
    end
  end

  def respond(result) do
    case result do
      {:ok, _} -> {:ok, %{space: Serializer.serialize(result.operation)}}
      {:error, :space_id, _} -> {:error, :bad_request}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end 
end
