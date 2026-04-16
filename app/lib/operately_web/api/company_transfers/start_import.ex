defmodule OperatelyWeb.Api.CompanyTransfers.StartImport do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  require Logger

  alias Operately.CompanyTransfers
  alias Operately.Blobs.Blob

  inputs do
    field :json_blob_id, :id, null: false
    field :zip_blob_id, :id, null: false
  end

  outputs do
    field :import_run, :company_import_run, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:account, fn -> find_account(conn) end)
    |> run(:me, fn -> find_me(conn) end)
    |> run(:blobs, fn ctx -> validate_blobs(inputs.json_blob_id, inputs.zip_blob_id, ctx.me) end)
    |> run(:import_run, fn ctx -> create_import(ctx.account, ctx.blobs) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, %{import_run: Serializer.serialize(ctx.import_run, level: :full)}}
      {:error, :blobs, %{error: :not_found}} -> {:error, :not_found}
      {:error, :blobs, %{error: :forbidden}} -> {:error, :forbidden}
      {:error, :blobs, %{error: :not_uploaded}} -> {:error, :bad_request, "Import artifacts must finish uploading before the import can start"}
      {:error, :import_run, changeset} -> {:error, changeset}
      error ->
        Logger.error("Unexpected error in start_import: #{inspect(error)}")
        {:error, :internal_server_error}
    end
  end

  defp validate_blobs(json_blob_id, zip_blob_id, person) do
    json_blob = Repo.get(Blob, json_blob_id) |> Repo.preload(:author)
    zip_blob = Repo.get(Blob, zip_blob_id) |> Repo.preload(:author)

    cond do
      is_nil(json_blob) or is_nil(zip_blob) ->
        {:error, :not_found}

      json_blob.author_id != person.id or zip_blob.author_id != person.id ->
        {:error, :forbidden}

      json_blob.status != :uploaded or zip_blob.status != :uploaded ->
        {:error, :not_uploaded}

      true ->
        {:ok, {json_blob, zip_blob}}
    end
  end

  defp create_import(account, {json_blob, zip_blob}) do
    attrs = %{
      json_blob_id: json_blob.id,
      zip_blob_id: zip_blob.id
    }

    CompanyTransfers.create_import_run(account, attrs)
  end
end
