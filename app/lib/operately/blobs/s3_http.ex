defmodule Operately.Blobs.S3Http do
  alias Operately.Blobs.S3Config

  def put_file(path, source_path, headers) when is_binary(path) and is_binary(source_path) and is_list(headers) do
    with {:ok, url} <- S3Config.presigned_url(:put, path, headers, [], expires_in: 3600),
         {:ok, status, _resp_headers, body} <- :hackney.request(:put, url, headers, {:file, source_path}, with_body: true) do
      case status do
        status when status in 200..299 -> :ok
        status -> {:error, {:http_error, status, body}}
      end
    end
  end

  def download_to_file(path, dest_path) when is_binary(path) and is_binary(dest_path) do
    File.mkdir_p!(Path.dirname(dest_path))

    with {:ok, url} <- S3Config.presigned_url(:get, path, [], [], expires_in: 3600) do
      case File.open(dest_path, [:write, :binary]) do
        {:ok, file} ->
          result =
            case :hackney.request(:get, url, [], "", []) do
              {:ok, status, _resp_headers, ref} when status in 200..299 ->
                stream_response(ref, file)

              {:ok, status, _resp_headers, ref} ->
                read_error_body(ref, status)

              {:error, reason} ->
                {:error, reason}
            end

          File.close(file)

          case result do
            :ok ->
              :ok

            {:error, _reason} = error ->
              _ = File.rm(dest_path)
              error
          end

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  def delete_object(path) when is_binary(path) do
    with {:ok, url} <- S3Config.presigned_url(:delete, path, [], [], expires_in: 3600),
         {:ok, status, _resp_headers, body} <- :hackney.request(:delete, url, [], "", with_body: true) do
      case status do
        status when status in 200..299 -> :ok
        status -> {:error, {:http_error, status, body}}
      end
    end
  end

  defp stream_response(ref, file) do
    case :hackney.stream_body(ref) do
      {:ok, chunk} ->
        :ok = IO.binwrite(file, chunk)
        stream_response(ref, file)

      :done ->
        :ok

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp read_error_body(ref, status) do
    case :hackney.body(ref) do
      {:ok, body} -> {:error, {:http_error, status, body}}
      {:error, {:closed, body}} -> {:error, {:http_error, status, body}}
      {:error, reason} -> {:error, {:http_error, status, inspect(reason)}}
    end
  end
end
