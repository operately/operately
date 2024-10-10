defmodule OperatelyWeb.Api.Mutations.AddSpaceMembers do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :string
    field :members, list_of(:add_member_input)
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:space_id, fn -> decode_id(inputs.space_id) end)
    |> run(:members, fn -> decode_member_ids(inputs) end)
    |> run(:space, fn ctx -> Operately.Groups.Group.get(ctx.me, id: ctx.space_id) end)
    |> run(:check_permissions, fn ctx -> Operately.Groups.Permissions.check(ctx.space.request_info.access_level, :can_add_members) end)
    |> run(:operation, fn ctx -> Operately.Operations.GroupMembersAdding.run(ctx.me, ctx.space_id, ctx.members) end)
    |> respond()
  end

  defp decode_member_ids(inputs) do
    Enum.reduce(inputs.members, [], fn member, acc ->
      case acc do
        {:error, _} -> acc
        _ ->
          case decode_id(member.id) do
            {:ok, id} -> [Map.put(member, :id, id) | acc]
            {:error, _} -> acc
          end
      end
    end)
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.operation}
      {:error, :space_id, _} -> {:error, :bad_request}
      {:error, :members, _} -> {:error, :bad_request}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
