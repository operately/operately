defmodule OperatelyWeb.Api.CompanyTransfers.StartImport do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  require Logger

  alias Operately.CompanyTransfers
  alias Operately.Blobs.Blob

  inputs do
    field :package_blob_id, :id, null: false
  end

  outputs do
    field :import_run, :company_import_run, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:account, fn -> find_account(conn) end)
    |> run(:blob, fn ctx -> validate_blob(inputs.package_blob_id, ctx.account) end)
    |> run(:import_run, fn ctx -> create_import(ctx.account, ctx.blob) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} ->
        {:ok, %{import_run: Serializer.serialize(ctx.import_run, level: :full)}}

      {:error, :blob, %{error: :not_found}} ->
        {:error, :not_found}

      {:error, :blob, %{error: :forbidden}} ->
        {:error, :forbidden}

      {:error, :blob, %{error: :invalid_purpose}} ->
        {:error, :bad_request, "Import packages must be staged through the company import flow"}

      {:error, :blob, %{error: :not_uploaded}} ->
        {:error, :bad_request, "Import package must finish uploading before the import can start"}

      {:error, :import_run, changeset} ->
        {:error, changeset}

      error ->
        Logger.error("Unexpected error in start_import: #{inspect(error)}")
        {:error, :internal_server_error}
    end
  end

  defp validate_blob(package_blob_id, account) do
    package_blob = Repo.get(Blob, package_blob_id)

    cond do
      is_nil(package_blob) ->
        {:error, :not_found}

      package_blob.purpose != :company_transfer_import_artifact ->
        {:error, :invalid_purpose}

      package_blob.account_id != account.id ->
        {:error, :forbidden}

      package_blob.status != :uploaded ->
        {:error, :not_uploaded}

      true ->
        {:ok, package_blob}
    end
  end

  defp create_import(account, package_blob) do
    attrs = %{
      package_blob_id: package_blob.id
    }

    CompanyTransfers.create_import_run(account, attrs)
  end
end
