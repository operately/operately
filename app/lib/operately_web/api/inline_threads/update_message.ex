defmodule OperatelyWeb.Api.InlineThreads.UpdateMessage do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Comments.InlineThread
  alias Operately.ResourceHubs.Permissions
  alias Operately.Updates.Comment
  alias Operately.Operations.InlineThreadMessageEditing

  inputs do
    field :message_id, :id, null: false
    field :content, :json, null: false
  end

  outputs do
    field :thread, :inline_thread, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:message, fn -> Comment.get(:system, id: inputs.message_id, entity_type: :inline_thread) end)
    |> run(:thread, fn ctx -> InlineThread.get(ctx.me, id: ctx.message.entity_id) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.thread.request_info.access_level, :can_comment_on_document, company_read_only: company_read_only(conn)) end)
    |> run(:ownership, fn ctx ->
      if ctx.message.author_id == ctx.me.id, do: {:ok, :allowed}, else: {:error, :forbidden}
    end)
    |> run(:operation, fn ctx -> InlineThreadMessageEditing.run(ctx.me, ctx.thread, ctx.message, inputs.content) end)
    |> run(:serialized, fn ctx -> {:ok, %{thread: Serializer.serialize(ctx.operation, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :message, _} -> {:error, :not_found}
      {:error, :thread, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :ownership, _} -> {:error, :forbidden}
      {:error, :operation, %{error: :invalid_content}} -> {:error, :bad_request}
      {:error, :operation, %{error: reason}} when reason in [:not_found, :forbidden] -> {:error, reason}
      _ -> {:error, :internal_server_error}
    end
  end
end
