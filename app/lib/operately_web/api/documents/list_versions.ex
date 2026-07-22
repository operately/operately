defmodule OperatelyWeb.Api.Documents.ListVersions do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Document, DocumentVersion, Permissions}

  inputs do
    field :document_id, :id, null: false
  end

  outputs do
    field :versions, list_of(:document_version), null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:document, fn ctx -> find_document(ctx.me, inputs.document_id) end)
    |> run(:permissions, fn ctx ->
      Permissions.check(ctx.document.request_info.access_level, :can_view,
        company_read_only: company_read_only(conn)
      )
    end)
    |> run(:versions, fn ctx ->
      versions =
        ctx.document.id
        |> DocumentVersion.list_for_document()
        |> DocumentVersion.mark_current(ctx.document.current_version)
        |> DocumentVersion.annotate_changes()

      {:ok, versions}
    end)
    |> run(:serialized, fn ctx ->
      {:ok, %{versions: Serializer.serialize(ctx.versions, level: :full)}}
    end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :document, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end

  defp find_document(me, document_id) do
    Document.get(me, id: document_id)
  end
end
