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
      {:hackney, [], [request: fn :put, "https://storage.example/put", ^headers, {:file, ^source_path}, [] -> {:ok, 200, [], ""} end]}
    ]) do
      assert :ok = S3Http.put_file("some/path", source_path, headers)
    end
  end

  test "download_to_file/2 streams a presigned GET response to disk" do
    dest_path = temp_path("s3-http-download.txt")
    caller = self()

    on_exit(fn ->
      cleanup_paths([dest_path])
    end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :get, "some/path", [], [], [expires_in: 3600] -> {:ok, "https://storage.example/get"} end]},
      {:hackney, [],
       [
         request: fn :get, "https://storage.example/get", [], "", opts ->
           assert :async in opts
           ref = make_ref()

           send(caller, {:hackney_response, ref, {:status, 200, "OK"}})
           send(caller, {:hackney_response, ref, {:headers, []}})
           send(caller, {:hackney_response, ref, "chunk-1"})
           send(caller, {:hackney_response, ref, "chunk-2"})
           send(caller, {:hackney_response, ref, :done})

           {:ok, ref}
         end,
         close: fn _ref -> :ok end
       ]}
    ]) do
      assert :ok = S3Http.download_to_file("some/path", dest_path)
      assert File.read!(dest_path) == "chunk-1chunk-2"
    end
  end

  test "download_to_file/2 returns http errors without writing a partial file" do
    dest_path = temp_path("s3-http-download-error.txt")
    caller = self()

    on_exit(fn ->
      cleanup_paths([dest_path])
    end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :get, "some/path", [], [], [expires_in: 3600] -> {:ok, "https://storage.example/get"} end]},
      {:hackney, [],
       [
         request: fn :get, "https://storage.example/get", [], "", opts ->
           assert :async in opts
           ref = make_ref()

           send(caller, {:hackney_response, ref, {:status, 404, "Not Found"}})
           send(caller, {:hackney_response, ref, {:headers, []}})
           send(caller, {:hackney_response, ref, "missing"})
           send(caller, {:hackney_response, ref, :done})

           {:ok, ref}
         end,
         close: fn _ref -> :ok end
       ]}
    ]) do
      assert {:error, {:http_error, 404, "missing"}} = S3Http.download_to_file("some/path", dest_path)
      refute File.exists?(dest_path)
    end
  end

  test "delete_object/1 sends a presigned DELETE request" do
    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :delete, "some/path", [], [], [expires_in: 3600] -> {:ok, "https://storage.example/delete"} end]},
      {:hackney, [], [request: fn :delete, "https://storage.example/delete", [], "", [] -> {:ok, 204, [], ""} end]}
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
