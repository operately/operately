defmodule OperatelyWeb.Api.Mutations.RemoveGroupMember do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions
  alias Operately.Operations.GroupMemberRemoving

  inputs do
    field :group_id, :string
    field :member_id, :string
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> me(conn) end)
    |> run(:group_id, fn -> decode_id(inputs.group_id) end)
    |> run(:member_id, fn -> decode_id(inputs.member_id) end)
    |> run(:space, fn ctx -> Groups.get_group_with_access_level(ctx.group_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.requester_access_level, :can_remove_member) end)
    |> run(:operation, fn ctx -> GroupMemberRemoving.run(ctx.me, ctx.space, ctx.member_id) end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, _} -> {:ok, %{}}
      {:error, :group_id, _} -> {:error, :bad_request}
      {:error, :member_id, _} -> {:error, :bad_request}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
