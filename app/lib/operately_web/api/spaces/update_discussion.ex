defmodule OperatelyWeb.Api.Spaces.UpdateDiscussion do
  @moduledoc """
  Updates a space discussion.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.Permissions
  alias Operately.Operations.DiscussionEditing
  alias Operately.Messages.Message

  inputs do
    field :id, :id, null: false
    field? :title, :string, null: true
    field? :body, :json, null: true
    field? :state, :discussion_state, null: true
  end

  outputs do
    field :discussion, :discussion, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:message, fn ctx -> Message.get(ctx.me, id: inputs.id, opts: [preload: :space]) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.message.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> DiscussionEditing.run(ctx.me, ctx.message, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{discussion: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :message, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
