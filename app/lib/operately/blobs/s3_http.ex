defmodule Operately.Blobs.S3Http do
  alias Operately.Blobs.S3Config

  @download_recv_timeout_ms 60_000

  def put_file(path, source_path, headers) when is_binary(path) and is_binary(source_path) and is_list(headers) do
    with {:ok, url} <- S3Config.presigned_url(:put, path, headers, [], expires_in: 3600),
         {:ok, status, _resp_headers, body} <- :hackney.request(:put, url, headers, {:file, source_path}, []) do
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
          result = stream_download(url, file)
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
         {:ok, status, _resp_headers, body} <- :hackney.request(:delete, url, [], "", []) do
      case status do
        status when status in 200..299 -> :ok
        status -> {:error, {:http_error, status, body}}
      end
    end
  end

  defp stream_download(url, file) do
    opts = [:async, {:recv_timeout, @download_recv_timeout_ms}]

    case :hackney.request(:get, url, [], "", opts) do
      {:ok, ref} ->
        await_status(ref, file)

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp await_status(ref, file) do
    receive do
      {:hackney_response, ^ref, {:status, status, _reason}} when status in 200..299 ->
        await_headers(ref, file)

      {:hackney_response, ^ref, {:status, status, _reason}} ->
        read_error_body(ref, status)

      {:hackney_response, ^ref, {:error, reason}} ->
        {:error, reason}
    after
      @download_recv_timeout_ms ->
        close_request(ref)
        {:error, :timeout}
    end
  end

  defp await_headers(ref, file) do
    receive do
      {:hackney_response, ^ref, {:headers, _headers}} ->
        stream_body(ref, file)

      {:hackney_response, ^ref, chunk} when is_binary(chunk) ->
        write_chunk(ref, file, chunk)

      {:hackney_response, ^ref, :done} ->
        :ok

      {:hackney_response, ^ref, {:error, reason}} ->
        {:error, reason}
    after
      @download_recv_timeout_ms ->
        close_request(ref)
        {:error, :timeout}
    end
  end

  defp stream_body(ref, file) do
    receive do
      {:hackney_response, ^ref, chunk} when is_binary(chunk) ->
        write_chunk(ref, file, chunk)

      {:hackney_response, ^ref, :done} ->
        :ok

      {:hackney_response, ^ref, {:error, reason}} ->
        {:error, reason}
    after
      @download_recv_timeout_ms ->
        close_request(ref)
        {:error, :timeout}
    end
  end

  defp write_chunk(ref, file, chunk) do
    :ok = IO.binwrite(file, chunk)
    stream_body(ref, file)
  end

  defp read_error_body(ref, status) do
    case collect_error_body(ref, []) do
      {:ok, body} -> {:error, {:http_error, status, body}}
      {:error, reason} -> {:error, {:http_error, status, inspect(reason)}}
    end
  end

  defp collect_error_body(ref, chunks) do
    receive do
      {:hackney_response, ^ref, {:headers, _headers}} ->
        collect_error_body(ref, chunks)

      {:hackney_response, ^ref, chunk} when is_binary(chunk) ->
        collect_error_body(ref, [chunk | chunks])

      {:hackney_response, ^ref, :done} ->
        {:ok, chunks |> Enum.reverse() |> IO.iodata_to_binary()}

      {:hackney_response, ^ref, {:error, reason}} ->
        {:error, reason}
    after
      @download_recv_timeout_ms ->
        close_request(ref)
        {:error, :timeout}
    end
  end

  defp close_request(ref) do
    try do
      :hackney.close(ref)
    catch
      _, _ -> :ok
    end
  end
end
