defmodule OperatelyWeb.Api.Mutations.EditSpaceMembersPermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions
  alias Operately.Operations.GroupMembersPermissionsEditing

  inputs do
    field :group_id, :string
    field :members, list_of(:edit_member_permissions_input)
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:space_id, fn -> decode_id(inputs.group_id) end)
    |> run(:members, fn -> decode_member_ids(inputs.members) end)
    |> run(:space, fn ctx -> Groups.get_group_with_access_level(ctx.space_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.requester_access_level, :can_edit_permissions) end)
    |> run(:operation, fn ctx -> GroupMembersPermissionsEditing.run(ctx.me, ctx.space, ctx.members) end)
    |> run(:serialized, fn -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp decode_member_ids(members) do
    Enum.reduce(members, {:ok, []}, fn member, res ->
      case res do
        {:error, _} -> res
        {:ok, acc} -> 
          case decode_id(member.id) do
            {:error, _} -> {:error, :bad_request}
            {:ok, id} -> {:ok, acc ++ [%{member | id: id}]}
          end
      end
    end)
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :space_id, _} -> {:error, :bad_request}
      {:error, :members, _} -> {:error, :bad_request}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
