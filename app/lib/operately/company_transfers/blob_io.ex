defmodule Operately.CompanyTransfers.BlobIO do
  @moduledoc """
  Transfer-facing wrapper around blob storage reads and writes.

  Company transfer code works with staged files on disk. This module keeps the
  blob-storage operations in one place so export/import code does not need to
  talk to low-level blob modules directly.
  """

  alias Operately.Blobs
  alias Operately.Blobs.Blob
  alias Operately.Blobs.S3Config
  alias Operately.Companies.Company
  alias Operately.People.Person

  def create_and_upload_company_file(%Company{} = company, %Person{} = author, source_path, content_type) do
    Blobs.upload_file_to_blob(company, author, source_path, content_type)
  end

  def upload_to_blob(%Blob{} = blob, source_path) do
    with {:ok, blob} <- Operately.Blobs.Upload.upload(blob, source_path),
         {:ok, blob} <- Blobs.update_blob(blob, %{status: :uploaded}) do
      {:ok, blob}
    end
  end

  def download_to_path(%Blob{} = blob, dest_path) do
    Blobs.download_blob_to_file(blob, dest_path)
  end

  def delete(%Blob{} = blob) do
    case blob.storage_type do
      :local ->
        blob
        |> Blob.path()
        |> then(&Path.join("/media", &1))
        |> File.rm()
        |> case do
          :ok -> :ok
          {:error, :enoent} -> :ok
          {:error, reason} -> {:error, reason}
        end

      :s3 ->
        blob
        |> Blob.path()
        |> then(fn path -> ExAws.S3.delete_object(S3Config.bucket!(), path) end)
        |> ExAws.request()
        |> case do
          {:ok, _} -> :ok
          {:error, reason} -> {:error, reason}
        end
    end
  end
end
