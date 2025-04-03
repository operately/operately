defmodule OperatelyWeb.Api.Mutations.EditSpace do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Group
  alias Operately.Groups.Permissions

  inputs do
    field :id, :id
    field :name, :string
    field :mission, :string
  end

  outputs do
    field :space, :space
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:space, fn ctx -> Group.get(ctx.me, id: inputs.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_edit) end)
    |> run(:operation, fn ctx -> Groups.edit_group_name_and_purpose(ctx.me, ctx.space, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{space: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end 
end
