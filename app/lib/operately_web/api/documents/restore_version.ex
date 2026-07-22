defmodule OperatelyWeb.Api.Documents.RestoreVersion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Document, Permissions}
  alias Operately.Operations.ResourceHubDocumentVersionRestoring

  inputs do
    field :document_id, :id, null: false
    field :version_number, :integer, null: false
    field :expected_current_version, :integer, null: false
  end

  outputs do
    field :document, :resource_hub_document, null: false
    field? :restored_version, :document_version, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:document, fn ctx -> find_document(ctx.me, inputs.document_id) end)
    |> run(:permissions, fn ctx ->
      Permissions.check(ctx.document.request_info.access_level, :can_edit_document,
        company_read_only: company_read_only(conn)
      )
    end)
    |> run(:operation, fn ctx ->
      ResourceHubDocumentVersionRestoring.run(ctx.me, ctx.document, %{
        version_number: inputs.version_number,
        expected_current_version: inputs.expected_current_version
      })
    end)
    |> run(:serialized, fn ctx ->
      {:ok,
       %{
         document: Serializer.serialize(ctx.operation.document),
         restored_version: Serializer.serialize(ctx.operation.restored_version)
       }}
    end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} ->
        {:ok, ctx.serialized}

      {:error, :document, _} ->
        {:error, :not_found}

      {:error, :permissions, _} ->
        {:error, :forbidden}

      {:error, :operation, %{error: :version_conflict}} ->
        {:error, :bad_request, "A newer version of this document exists", %{reason: "version_conflict"}}

      {:error, :operation, %{error: :not_found}} ->
        {:error, :not_found}

      {:error, :operation, _} ->
        {:error, :internal_server_error}

      _ ->
        {:error, :internal_server_error}
    end
  end

  defp find_document(me, document_id) do
    Document.get(me, id: document_id, opts: [preload: [:node, :resource_hub]])
  end
end
