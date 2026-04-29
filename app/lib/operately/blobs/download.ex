defmodule Operately.Blobs.Download do
  @moduledoc """
  Handles downloading files from blob storage (local or S3).
  """

  alias Operately.Blobs.Blob

  def download(blob = %Blob{}, dest_path) do
    handler(blob).download(blob, dest_path)
  end

  defp handler(blob) do
    case blob.storage_type do
      :s3 -> Operately.Blobs.Download.S3
      :local -> Operately.Blobs.Download.Local
      _ -> raise ArgumentError, "Unknown storage type #{inspect(blob.storage_type)}"
    end
  end

  defmodule Local do
    @moduledoc """
    Handles downloading files from local filesystem storage.
    """

    alias Operately.Blobs.Blob

    def download(%Blob{} = blob, dest_path) do
      filename = Blob.path(blob)
      source_path = "/media/#{filename}"

      if File.exists?(source_path) do
        File.mkdir_p!(Path.dirname(dest_path))
        File.cp!(source_path, dest_path)
        :ok
      else
        {:error, "Blob file not found in local storage"}
      end
    end
  end

  defmodule S3 do
    @moduledoc """
    Handles downloading files from S3 storage.
    """

    alias Operately.Blobs.Blob
    alias Operately.Blobs.S3Config

    def download(%Blob{} = blob, dest_path) do
      bucket = S3Config.bucket!()
      path = Blob.path(blob)
      File.mkdir_p!(Path.dirname(dest_path))

      case ExAws.S3.download_file(bucket, path, dest_path) |> ExAws.request(S3Config.request_config()) do
        {:ok, _result} ->
          :ok

        {:error, reason} ->
          {:error, "Failed to download from S3: #{inspect(reason)}"}
      end
    end
  end
end
