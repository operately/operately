defmodule OperatelyWeb.Api.Mutations.EditSpaceMembersPermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.Group
  alias Operately.Groups.Permissions
  alias Operately.Operations.GroupMembersPermissionsEditing

  inputs do
    field :space_id, :id, null: false
    field :members, list_of(:edit_member_permissions_input), null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:space, fn ctx -> Group.get(ctx.me, id: inputs.space_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :has_full_access) end)
    |> run(:operation, fn ctx -> GroupMembersPermissionsEditing.run(ctx.me, ctx.space, inputs.members) end)
    |> run(:serialized, fn -> {:ok, %{success: true}} end)
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
