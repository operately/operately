defmodule Operately.Blobs.S3HttpTest do
  use ExUnit.Case

  import ExUnit.CaptureLog
  import Mock

  alias Operately.Blobs.S3Http

  test "put_file/3 streams a file with a Unicode name through a presigned PUT url" do
    source_path = temp_path("Κωδικός QR για SCIROCCO AE.png")
    payload = <<0, 255, 1, 2, 3>>
    headers = [{"Content-Type", "image/png"}, {"Content-Length", Integer.to_string(byte_size(payload))}]
    File.write!(source_path, payload)

    on_exit(fn ->
      cleanup_paths([source_path])
    end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :put, "some/path", ^headers, [], [expires_in: 3600] -> {:ok, "https://storage.example/put"} end]},
      {Req, [],
       [
         put: fn "https://storage.example/put", opts ->
           assert opts[:headers] == headers
           assert %File.Stream{} = opts[:body]
           assert opts[:body] |> Enum.to_list() |> IO.iodata_to_binary() == payload
           assert opts[:connect_options] == [timeout: 30_000]
           assert opts[:pool_timeout] == 30_000
           assert opts[:receive_timeout] == 3_600_000
           assert opts[:retry] == false
           assert opts[:redirect] == false

           {:ok, %Req.Response{status: 200, body: ""}}
         end
       ]}
    ]) do
      assert :ok = S3Http.put_file("some/path", source_path, headers)
    end
  end

  test "put_file/3 retries once and preserves recognized request-process exits" do
    source_path = temp_path("s3-http-upload-exit.txt")
    headers = [{"Content-Type", "text/plain"}, {"Content-Length", "12"}]
    File.write!(source_path, "hello world!")
    {:ok, attempts} = Agent.start_link(fn -> 0 end)
    request_url = "https://storage.example/put?X-Amz-Signature=secret"

    on_exit(fn ->
      cleanup_paths([source_path])
    end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :put, "some/path", ^headers, [], [expires_in: 3600] -> {:ok, "https://storage.example/put"} end]},
      {Req, [],
       [
         put: fn "https://storage.example/put", _opts ->
           Agent.update(attempts, &(&1 + 1))
           exit({{:noproc, :gen_statem}, {:gen_statem, :call, [self(), {:request, "PUT", request_url}]}})
         end
       ]}
    ]) do
      log =
        capture_log(fn ->
          assert {:error, {:request_exit, {:noproc, :gen_statem}}} = S3Http.put_file("some/path", source_path, headers)
        end)

      assert Agent.get(attempts, & &1) == 2
      assert log =~ "Retrying S3 file upload after transient failure"
      assert log =~ "request_exit"
      refute log =~ request_url
    end
  end

  test "put_file/3 retries known transient transport errors once" do
    Enum.each([:timeout, :connect_timeout, :closed, :econnreset], &assert_retries_transport_error/1)
  end

  test "put_file/3 does not retry HTTP client errors" do
    source_path = temp_path("s3-http-upload-400.txt")
    headers = [{"Content-Type", "text/plain"}, {"Content-Length", "12"}]
    File.write!(source_path, "hello world!")
    {:ok, attempts} = Agent.start_link(fn -> 0 end)

    on_exit(fn ->
      cleanup_paths([source_path])
    end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :put, "some/path", ^headers, [], [expires_in: 3600] -> {:ok, "https://storage.example/put"} end]},
      {Req, [],
       [
         put: fn "https://storage.example/put", _opts ->
           Agent.update(attempts, &(&1 + 1))
           {:ok, %Req.Response{status: 403, body: "forbidden"}}
         end
       ]}
    ]) do
      assert {:error, {:http_error, 403, "forbidden"}} = S3Http.put_file("some/path", source_path, headers)
      assert Agent.get(attempts, & &1) == 1
    end
  end

  test "put_file/3 retries retryable HTTP responses once" do
    Enum.each([408, 429, 503], &assert_retries_http_status/1)
  end

  test "put_file/3 does not retry redirects or unknown transport errors" do
    Enum.each([{:http_error, 302, "redirect"}, :invalid_request], &assert_does_not_retry/1)
  end

  test "put_file/3 does not catch or retry raised errors" do
    source_path = temp_path("s3-http-upload-raise.txt")
    headers = [{"Content-Type", "text/plain"}, {"Content-Length", "12"}]
    File.write!(source_path, "hello world!")
    {:ok, attempts} = Agent.start_link(fn -> 0 end)

    on_exit(fn -> cleanup_paths([source_path]) end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :put, "some/path", ^headers, [], [expires_in: 3600] -> {:ok, "https://storage.example/put"} end]},
      {Req, [],
       [
         put: fn "https://storage.example/put", _opts ->
           Agent.update(attempts, &(&1 + 1))
           raise ArgumentError, "invalid upload request"
         end
       ]}
    ]) do
      assert_raise ArgumentError, "invalid upload request", fn ->
        S3Http.put_file("some/path", source_path, headers)
      end

      assert Agent.get(attempts, & &1) == 1
    end
  end

  test "put_file/3 does not catch or retry programming-error exits" do
    source_path = temp_path("s3-http-upload-programming-exit.txt")
    headers = [{"Content-Type", "text/plain"}, {"Content-Length", "12"}]
    File.write!(source_path, "hello world!")
    {:ok, attempts} = Agent.start_link(fn -> 0 end)

    function_clause = {:function_clause, [{:hackney_conn, :send_body, [:hackney_ssl, :socket, {:file, source_path}], []}]}
    exit_reason = {function_clause, {:gen_statem, :call, [self(), :request]}}

    on_exit(fn -> cleanup_paths([source_path]) end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :put, "some/path", ^headers, [], [expires_in: 3600] -> {:ok, "https://storage.example/put"} end]},
      {Req, [],
       [
         put: fn "https://storage.example/put", _opts ->
           Agent.update(attempts, &(&1 + 1))
           exit(exit_reason)
         end
       ]}
    ]) do
      assert catch_exit(S3Http.put_file("some/path", source_path, headers)) == exit_reason
      assert Agent.get(attempts, & &1) == 1
    end
  end

  test "put_file/3 returns the final error when the retry also fails" do
    source_path = temp_path("s3-http-upload-timeout.txt")
    headers = [{"Content-Type", "text/plain"}, {"Content-Length", "12"}]
    File.write!(source_path, "hello world!")
    {:ok, attempts} = Agent.start_link(fn -> 0 end)

    on_exit(fn ->
      cleanup_paths([source_path])
    end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :put, "some/path", ^headers, [], [expires_in: 3600] -> {:ok, "https://storage.example/put"} end]},
      {Req, [],
       [
         put: fn "https://storage.example/put", _opts ->
           case Agent.get_and_update(attempts, fn count -> {count + 1, count + 1} end) do
             1 -> {:error, %Req.TransportError{reason: :timeout}}
             2 -> {:ok, %Req.Response{status: 503, body: "still unavailable"}}
           end
         end
       ]}
    ]) do
      capture_log(fn ->
        assert {:error, {:http_error, 503, "still unavailable"}} = S3Http.put_file("some/path", source_path, headers)
      end)

      assert Agent.get(attempts, & &1) == 2
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

  defp assert_retries_http_status(status) do
    source_path = temp_path("s3-http-upload-#{status}.txt")
    headers = [{"Content-Type", "text/plain"}, {"Content-Length", "12"}]
    File.write!(source_path, "hello world!")
    {:ok, attempts} = Agent.start_link(fn -> 0 end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :put, "some/path", ^headers, [], [expires_in: 3600] -> {:ok, "https://storage.example/put"} end]},
      {Req, [],
       [
         put: fn "https://storage.example/put", opts ->
           assert %File.Stream{} = opts[:body]
           assert opts[:body] |> Enum.to_list() |> IO.iodata_to_binary() == "hello world!"

           case Agent.get_and_update(attempts, fn count -> {count + 1, count + 1} end) do
             1 -> {:ok, %Req.Response{status: status, body: "retryable"}}
             2 -> {:ok, %Req.Response{status: 200, body: ""}}
           end
         end
       ]}
    ]) do
      capture_log(fn -> assert :ok = S3Http.put_file("some/path", source_path, headers) end)
      assert Agent.get(attempts, & &1) == 2
    end

    cleanup_paths([source_path])
  end

  defp assert_retries_transport_error(reason) do
    source_path = temp_path("s3-http-upload-#{reason}.txt")
    headers = [{"Content-Type", "text/plain"}, {"Content-Length", "12"}]
    File.write!(source_path, "hello world!")
    {:ok, attempts} = Agent.start_link(fn -> 0 end)

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :put, "some/path", ^headers, [], [expires_in: 3600] -> {:ok, "https://storage.example/put"} end]},
      {Req, [],
       [
         put: fn "https://storage.example/put", opts ->
           assert %File.Stream{} = opts[:body]
           assert opts[:body] |> Enum.to_list() |> IO.iodata_to_binary() == "hello world!"

           case Agent.get_and_update(attempts, fn count -> {count + 1, count + 1} end) do
             1 -> {:error, %Req.TransportError{reason: reason}}
             2 -> {:ok, %Req.Response{status: 200, body: ""}}
           end
         end
       ]}
    ]) do
      capture_log(fn -> assert :ok = S3Http.put_file("some/path", source_path, headers) end)
      assert Agent.get(attempts, & &1) == 2
    end

    cleanup_paths([source_path])
  end

  defp assert_does_not_retry(reason) do
    source_path = temp_path("s3-http-upload-non-retryable.txt")
    headers = [{"Content-Type", "text/plain"}, {"Content-Length", "12"}]
    File.write!(source_path, "hello world!")
    {:ok, attempts} = Agent.start_link(fn -> 0 end)

    response =
      case reason do
        {:http_error, status, body} -> {:ok, %Req.Response{status: status, body: body}}
        transport_reason -> {:error, transport_reason}
      end

    with_mocks([
      {Operately.Blobs.S3Config, [], [presigned_url: fn :put, "some/path", ^headers, [], [expires_in: 3600] -> {:ok, "https://storage.example/put"} end]},
      {Req, [],
       [
         put: fn "https://storage.example/put", _opts ->
           Agent.update(attempts, &(&1 + 1))
           response
         end
       ]}
    ]) do
      assert {:error, ^reason} = S3Http.put_file("some/path", source_path, headers)
      assert Agent.get(attempts, & &1) == 1
    end

    cleanup_paths([source_path])
  end

  defp cleanup_paths(paths) do
    Enum.each(paths, fn path ->
      if File.exists?(path), do: File.rm_rf!(path)
    end)
  end
end
