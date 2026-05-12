defmodule Operately.CompanyTransfers.Import.FileImporter do
  @moduledoc """
  Uploads package file payloads into destination blob storage during import.

  Relational import creates the destination `blobs` rows and the translation
  plan tells us which imported blob each package file belongs to. This module
  copies the extracted payload bytes into the destination storage backend and
  cleans up any already-uploaded files if a later upload fails.
  """

  require Logger

  alias Operately.Blobs
  alias Operately.CompanyTransfers.BlobIO
  alias Operately.CompanyTransfers.Import.Package

  def import(%Package{files: []}, _files_root, _blob_id_map), do: {:ok, 0}

  def import(%Package{} = package, files_root, blob_id_map) when is_binary(files_root) and is_map(blob_id_map) do
    package.files
    |> Enum.reduce_while({:ok, []}, fn file_entry, {:ok, uploaded_blobs} ->
      case upload_file(file_entry, files_root, blob_id_map) do
        {:ok, blob} ->
          {:cont, {:ok, [blob | uploaded_blobs]}}

        :skip ->
          {:cont, {:ok, uploaded_blobs}}

        {:error, reason} ->
          cleanup_uploads(uploaded_blobs)
          {:halt, {:error, reason}}
      end
    end)
    |> case do
      {:ok, uploaded_blobs} -> {:ok, length(uploaded_blobs)}
      {:error, reason} -> {:error, reason}
    end
  end

  defp upload_file(%{"blob_id" => source_blob_id, "path" => relative_path}, files_root, blob_id_map) do
    with translated_blob_id when is_binary(translated_blob_id) <- Map.get(blob_id_map, source_blob_id),
         source_path = Path.join(files_root, relative_path),
         true <- File.exists?(source_path),
         %{} = blob <- Blobs.get_blob!(translated_blob_id),
         {:ok, blob} <- BlobIO.upload_to_blob(blob, source_path) do
      {:ok, blob}
    else
      nil ->
        {:error, {:missing_file_blob_translation, source_blob_id}}

      false ->
        Logger.warning("Skipping file #{relative_path} during import: payload not present in package")
        :skip

      {:error, reason} ->
        {:error, {:file_upload_failed, source_blob_id, reason}}
    end
  end

  defp cleanup_uploads(uploaded_blobs) do
    Enum.each(uploaded_blobs, fn blob ->
      _ = BlobIO.delete(blob)
    end)
  end
end
