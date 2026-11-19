defmodule OperatelyWeb.Api.InlineThreads.Create do
  use Gettext, backend: OperatelyWeb.Gettext
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.Permissions
  alias Operately.ResourceHubs.Document
  alias Operately.Operations.InlineThreadCreating

  inputs do
    field :resource_type, :inline_thread_resource_type, null: false
    field :resource_id, :id, null: false
    field :source_version, :integer, null: false
    field :from, :integer, null: false
    field :to, :integer, null: false
    field :quote, :string, null: false
    field :content, :json, null: false
  end

  outputs do
    field :thread, :inline_thread, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:document, fn ctx -> Document.get(ctx.me, id: inputs.resource_id) end)
    |> run(:published, fn ctx -> check_published(ctx.document) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.document.request_info.access_level, :can_comment_on_document, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> InlineThreadCreating.run(ctx.me, ctx.document, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{thread: Serializer.serialize(ctx.operation, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :document, _} -> {:error, :not_found}
      {:error, :published, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, %{error: :version_conflict}} -> {:error, :bad_request, gettext("A newer version of this document exists"), %{reason: "version_conflict"}}
      {:error, :operation, %{error: reason}} when reason in [:invalid_anchor, :invalid_content] -> {:error, :bad_request}
      {:error, :operation, %{error: reason}} when reason in [:not_found, :forbidden] -> {:error, reason}
      _ -> {:error, :internal_server_error}
    end
  end
end
