defmodule OperatelyWeb.Api.Mutations.AddSpaceMembers do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :id
    field :members, list_of(:add_member_input)
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:space, fn ctx -> Operately.Groups.Group.get(ctx.me, id: inputs.space_id) end)
    |> run(:check_permissions, fn ctx -> Operately.Groups.Permissions.check(ctx.space.request_info.access_level, :can_add_members) end)
    |> run(:operation, fn ctx -> Operately.Operations.GroupMembersAdding.run(ctx.me, ctx.space.id, inputs.members) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, _} -> {:ok, %{}}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
