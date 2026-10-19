defmodule OperatelyWeb.Api.Spaces.UpdateMembersPermissions do
  @moduledoc """
  Updates permissions for multiple members in a space.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.Group
  alias Operately.Groups.Permissions
  alias Operately.Operations.GroupMembersPermissionsEditing
  alias Operately.People

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
    |> run(:space, fn ctx -> Group.get(ctx.me, id: inputs.space_id, company_id: ctx.me.company_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :has_full_access, company_read_only: company_read_only(conn)) end)
    |> run(:members, fn ctx -> validate_members(ctx.space, inputs.members) end)
    |> run(:operation, fn ctx -> GroupMembersPermissionsEditing.run(ctx.me, ctx.space, ctx.members) end)
    |> run(:serialized, fn -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp validate_members(space, members) do
    members = latest_member_permissions(members)

    case People.validate_active_company_members(space.company_id, Enum.map(members, & &1.id)) do
      :ok -> {:ok, members}
      {:error, :invalid_company_member} = error -> error
    end
  end

  defp latest_member_permissions(members) do
    latest = Map.new(members, &{&1.id, &1})

    members
    |> Enum.map(& &1.id)
    |> Enum.uniq()
    |> Enum.map(&Map.fetch!(latest, &1))
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :members, _} -> {:error, :bad_request}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
