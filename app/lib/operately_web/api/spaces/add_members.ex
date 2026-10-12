defmodule OperatelyWeb.Api.Spaces.AddMembers do
  @moduledoc """
  Adds members to a space.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :id, null: false
    field :members, list_of(:add_member_input), null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:space, fn ctx -> Operately.Groups.Group.get(ctx.me, id: inputs.space_id, company_id: ctx.me.company_id) end)
    |> run(:check_permissions, fn ctx -> Operately.Groups.Permissions.check(ctx.space.request_info.access_level, :has_full_access, company_read_only: company_read_only(conn)) end)
    |> run(:validate_members, fn ctx -> validate_members(ctx.space, inputs.members) end)
    |> run(:operation, fn ctx -> Operately.Operations.GroupMembersAdding.run(ctx.me, ctx.space.id, inputs.members) end)
    |> run(:serialized, fn -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp validate_members(space, members) do
    member_ids = Enum.map(members, & &1.id)

    case Operately.People.validate_active_company_members(space.company_id, member_ids) do
      :ok -> {:ok, :validated}
      error -> error
    end
  end

  defp respond(result) do
    case result do
      {:ok, _} -> {:ok, %{success: true}}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :validate_members, _} -> {:error, :bad_request}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
