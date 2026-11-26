defmodule OperatelyWeb.Api.Documents.Update do
  @moduledoc """
  Updates a document.
  """

  use Gettext, backend: OperatelyWeb.Gettext
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Document, Permissions}
  alias Operately.Operations.ResourceHubDocumentEditing

  inputs do
    field :document_id, :id, null: false
    field :name, :string, null: false
    field :content, :json, null: false
    field? :expected_version, :integer, null: true
    field? :send_notifications_to_everyone, :boolean, null: true
    field? :subscriber_ids, list_of(:id), null: true
  end

  outputs do
    field? :document, :resource_hub_document, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_attrs(inputs, conn.body_params) end)
    |> run(:document, fn ctx -> find_document(ctx.me, ctx.attrs) end)
    |> run(:permissions, fn ctx -> Permissions.check(ctx.document.request_info.access_level, :can_edit_document, company_read_only: company_read_only(conn)) end)
    |> run(:operation, fn ctx -> ResourceHubDocumentEditing.run(ctx.me, ctx.document, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{document: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :document, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      {:error, :operation, %{error: :version_conflict}} ->
        {:error, :bad_request, gettext("A newer version of this document exists"), %{reason: "version_conflict"}}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_attrs(inputs, body_params) do
    # TurboConnect normalizes a null list to [], so use the request body to keep null distinct from an explicit empty list.
    subscriber_ids =
      case body_params do
        %{"subscriber_ids" => nil} -> nil
        _ -> inputs[:subscriber_ids]
      end

    subscription_attrs =
      if is_nil(inputs[:send_notifications_to_everyone]) and is_nil(subscriber_ids) do
        %{send_to_everyone: nil, subscriber_ids: nil}
      else
        %{
          send_to_everyone: inputs[:send_notifications_to_everyone] || false,
          subscriber_ids: subscriber_ids || []
        }
      end

    {:ok, Map.merge(inputs, subscription_attrs)}
  end

  defp find_document(me, inputs) do
    Document.get(me, id: inputs.document_id, opts: [
      preload: [:node, :resource_hub],
    ])
  end
end
