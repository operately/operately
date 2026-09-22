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
    field? :scheduled_at, :datetime, null: true
  end

  outputs do
    field :discussion, :discussion, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:message, fn ctx -> Message.get(ctx.me, id: inputs.id, opts: [preload: :space]) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.message.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
    |> run(:check_publish_access, fn ctx -> authorize_publish(ctx.me, ctx.message, inputs) end)
    |> run(:operation, fn ctx -> DiscussionEditing.run(ctx.me, ctx.message, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{discussion: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp authorize_publish(me, message, inputs) do
    cond do
      not publishing?(message, inputs) -> {:ok, :allowed}
      message.author_id == me.id -> {:ok, :allowed}
      true -> {:error, :forbidden}
    end
  end

  defp publishing?(message, inputs) do
    message.state in [:draft, :scheduled] and inputs[:state] == :published
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :message, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :check_publish_access, _} -> {:error, :forbidden}
      {:error, :operation, %{error: :scheduled_at_must_be_in_the_future}} ->
        {:error, :bad_request, "Scheduled time must be in the future"}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
