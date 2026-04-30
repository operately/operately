defmodule Operately.Blobs.Upload do
  @moduledoc """
  Handles uploading files to blob storage (local or S3).
  """

  alias Operately.Blobs.Blob

  @doc """
  Uploads a file from the server filesystem to blob storage.
  Creates a blob record, uploads the file, and marks it as uploaded.

  Returns {:ok, blob} on success.
  """
  def upload_file_to_blob(company, author, file_path, content_type) do
    filename = Path.basename(file_path)
    file_size = File.stat!(file_path).size

    # Create blob record
    {:ok, blob} =
      Operately.Blobs.create_blob(%{
        purpose: :company_file,
        company_id: company.id,
        author_id: author.id,
        status: :pending,
        filename: filename,
        size: file_size,
        content_type: content_type
      })

    # Upload file to storage
    {:ok, blob} = upload(blob, file_path)

    # Mark blob as uploaded
    Operately.Blobs.update_blob(blob, %{status: :uploaded})
  end

  @doc """
  Uploads a file to blob storage for an existing blob record.
  """
  def upload(blob = %Blob{}, source_path) do
    handler(blob).upload(blob, source_path)
  end

  defp handler(blob) do
    case blob.storage_type do
      :s3 -> Operately.Blobs.Upload.S3
      :local -> Operately.Blobs.Upload.Local
      _ -> raise ArgumentError, "Unknown storage type #{inspect(blob.storage_type)}"
    end
  end

  defmodule Local do
    @moduledoc """
    Handles uploading files to local filesystem storage.
    """

    alias Operately.Blobs.Blob

    def upload(%Blob{} = blob, source_path) do
      filename = Blob.path(blob)
      dest_path = "/media/#{filename}"
      File.mkdir_p!(Path.dirname(dest_path))
      File.cp!(source_path, dest_path)
      {:ok, blob}
    end
  end

  defmodule S3 do
    @moduledoc """
    Handles uploading files to S3 storage.
    """

    alias Operately.Blobs.Blob
    alias Operately.Blobs.S3Http

    def upload(%Blob{} = blob, source_path) do
      path = Blob.path(blob)
      content_length = File.stat!(source_path).size

      headers = [
        {"Content-Type", blob.content_type},
        {"Content-Length", Integer.to_string(content_length)}
      ]

      case S3Http.put_file(path, source_path, headers) do
        :ok -> {:ok, blob}
        {:error, reason} -> {:error, reason}
      end
    end
  end
end
