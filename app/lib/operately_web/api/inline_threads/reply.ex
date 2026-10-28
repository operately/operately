defmodule OperatelyWeb.Api.InlineThreads.Reply do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Comments.InlineThread
  alias Operately.ResourceHubs.Permissions
  alias Operately.Operations.InlineThreadReplying

  inputs do
    field :thread_id, :id, null: false
    field :content, :json, null: false
  end

  outputs do
    field :thread, :inline_thread, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:thread, fn ctx -> InlineThread.get(ctx.me, id: inputs.thread_id) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.thread.request_info.access_level, :can_comment_on_document, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> InlineThreadReplying.run(ctx.me, ctx.thread, inputs.content) end)
    |> run(:serialized, fn ctx -> {:ok, %{thread: Serializer.serialize(ctx.operation, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :thread, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, %{error: :invalid_content}} -> {:error, :bad_request}
      {:error, :operation, %{error: reason}} when reason in [:not_found, :forbidden] -> {:error, reason}
      _ -> {:error, :internal_server_error}
    end
  end
end
