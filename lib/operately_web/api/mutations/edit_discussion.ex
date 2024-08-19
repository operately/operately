defmodule OperatelyWeb.Api.Mutations.EditDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions
  alias Operately.Operations.DiscussionEditing

  inputs do
    field :discussion_id, :string
    field :title, :string
    field :body, :string
  end

  outputs do
    field :discussion, :discussion
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.discussion_id) end)
    |> run(:discussion, fn ctx -> {:ok, Operately.Updates.get_update!(ctx.id)} end)
    |> run(:space, fn ctx -> Groups.get_group_with_access_level(ctx.discussion.updatable_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.requester_access_level, :can_edit_discussions) end)
    |> run(:operation, fn ctx -> DiscussionEditing.run(ctx.me, ctx.discussion, ctx.space, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{discussion: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :discussion, _} -> {:error, :not_found}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
