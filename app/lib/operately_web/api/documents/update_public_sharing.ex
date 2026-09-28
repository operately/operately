defmodule OperatelyWeb.Api.Documents.UpdatePublicSharing do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Document, Permissions, PublicDocument}
  alias Operately.Operations.ResourceHubDocumentPublicSharing

  inputs do
    field :document_id, :id, null: false
    field :enabled, :boolean, null: false
  end

  outputs do
    field :public_url, :string, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:document, fn ctx -> Document.get(ctx.me, id: inputs.document_id, opts: [preload: [:node, :resource_hub]]) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.document.request_info.access_level, :can_edit_document, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> ResourceHubDocumentPublicSharing.run(ctx.me, ctx.document, inputs.enabled) end)
    |> case do
      {:ok, ctx} -> {:ok, %{public_url: PublicDocument.url(ctx.operation)}}
      {:error, :document, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, %{error: :draft}} -> {:error, :bad_request, "Publish the document before sharing it publicly"}
      _ -> {:error, :internal_server_error}
    end
  end
end
