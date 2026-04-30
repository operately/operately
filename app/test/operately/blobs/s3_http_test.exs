defmodule Operately.Blobs.S3HttpTest do
  use ExUnit.Case

  import Mock

  alias Operately.Blobs.S3Http

  test "put_file/3 uploads through a presigned PUT url" do
    source_path = temp_path("s3-http-upload.txt")
    headers = [{"Content-Type", "text/plain"}, {"Content-Length", "12"}]
    File.write!(source_path, "hello world!")

    on_exit(fn ->
      cleanup_paths([source_path])
    end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :put, "some/path", ^headers, [], [expires_in: 3600] -> {:ok, "https://storage.example/put"} end]},
      {:hackney, [], [request: fn :put, "https://storage.example/put", ^headers, {:file, ^source_path}, [with_body: true] -> {:ok, 200, [], ""} end]}
    ]) do
      assert :ok = S3Http.put_file("some/path", source_path, headers)
    end
  end

  test "download_to_file/2 streams a presigned GET response to disk" do
    dest_path = temp_path("s3-http-download.txt")
    Process.put(:download_chunks, ["chunk-1", "chunk-2"])

    on_exit(fn ->
      Process.delete(:download_chunks)
      cleanup_paths([dest_path])
    end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :get, "some/path", [], [], [expires_in: 3600] -> {:ok, "https://storage.example/get"} end]},
      {:hackney, [],
       [
         request: fn :get, "https://storage.example/get", [], "", [] -> {:ok, 200, [], :download_ref} end,
         stream_body: fn :download_ref ->
           case Process.get(:download_chunks) do
             [chunk | rest] ->
               Process.put(:download_chunks, rest)
               {:ok, chunk}

             [] ->
               :done
           end
         end
       ]}
    ]) do
      assert :ok = S3Http.download_to_file("some/path", dest_path)
      assert File.read!(dest_path) == "chunk-1chunk-2"
    end
  end

  test "delete_object/1 sends a presigned DELETE request" do
    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :delete, "some/path", [], [], [expires_in: 3600] -> {:ok, "https://storage.example/delete"} end]},
      {:hackney, [], [request: fn :delete, "https://storage.example/delete", [], "", [with_body: true] -> {:ok, 204, [], ""} end]}
    ]) do
      assert :ok = S3Http.delete_object("some/path")
    end
  end

  defp temp_path(filename) do
    Path.join(System.tmp_dir!(), "#{System.unique_integer([:positive])}-#{filename}")
  end

  defp cleanup_paths(paths) do
    Enum.each(paths, fn path ->
      if File.exists?(path), do: File.rm_rf!(path)
    end)
  end
end
