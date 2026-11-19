defmodule OperatelyWeb.Api.InlineThreads.List do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Comments.InlineThread
  alias Operately.ResourceHubs.Permissions
  alias Operately.ResourceHubs.Document

  inputs do
    field :resource_type, :inline_thread_resource_type, null: false
    field :resource_id, :id, null: false
  end

  outputs do
    field :threads, list_of(:inline_thread), null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:document, fn ctx -> Document.get(ctx.me, id: inputs.resource_id) end)
    |> run(:published, fn ctx -> check_published(ctx.document) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.document.request_info.access_level, :can_view, company_read_only: company_read_only(conn)) end)
    |> run(:threads, fn ctx ->
      {:ok, InlineThread.list(ctx.me, resource_id: ctx.document.id, opts: [order_by: [asc: :inserted_at, asc: :id]] ++ InlineThread.read_options())}
    end)
    |> run(:serialized, fn ctx -> {:ok, %{threads: Serializer.serialize(ctx.threads, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :document, _} -> {:error, :not_found}
      {:error, :published, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end
end
