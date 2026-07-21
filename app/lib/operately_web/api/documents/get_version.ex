defmodule OperatelyWeb.Api.Documents.GetVersion do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.ResourceHubs.{Document, DocumentVersion, Permissions}

  inputs do
    field :document_id, :id, null: false
    field :version_number, :integer, null: false
  end

  outputs do
    field :version, :document_version, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:document, fn ctx -> Document.get(ctx.me, id: inputs.document_id) end)
    |> run(:permissions, fn ctx ->
      Permissions.check(ctx.document.request_info.access_level, :can_view,
        company_read_only: company_read_only(conn)
      )
    end)
    |> run(:version, fn ctx ->
      case DocumentVersion.get_by_document_and_number(ctx.document.id, inputs.version_number) do
        nil ->
          {:error, :not_found}

        version ->
          version =
            version
            |> Operately.Repo.preload(:editor)
            |> DocumentVersion.mark_current(ctx.document.current_version)

          {:ok, version}
      end
    end)
    |> run(:serialized, fn ctx ->
      {:ok, %{version: Serializer.serialize(ctx.version, level: :full)}}
    end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :document, _} -> {:error, :not_found}
      {:error, :version, _} -> {:error, :not_found}
      {:error, :permissions, _} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end
end
