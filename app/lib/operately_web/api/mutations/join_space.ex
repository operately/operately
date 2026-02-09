defmodule OperatelyWeb.Api.Mutations.JoinSpace do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.{Permissions, Group}

  inputs do
    field? :space_id, :id, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:space, fn ctx -> Group.get(ctx.me, id: inputs.space_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_edit) end)
    |> run(:operation, fn ctx -> Operately.Operations.SpaceJoining.run(ctx.me, inputs.space_id) end)
    |> run(:serialized, fn _ctx -> {:ok, %{}} end)
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
