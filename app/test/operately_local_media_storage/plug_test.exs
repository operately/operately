defmodule OperatelyLocalMediaStorage.PlugTest do
  use ExUnit.Case, async: true
  import Plug.Test

  alias Operately.Blobs.Tokens

  describe "cache headers functionality" do
    test "put_cache_headers/1 adds correct cache control header" do
      # Test the cache headers function directly
      conn =
        conn(:get, "/test-file.txt")
        |> OperatelyLocalMediaStorage.Plug.put_cache_headers()

      assert [cache_control] = Plug.Conn.get_resp_header(conn, "cache-control")
      # Update this assertion based on what you actually set in the plug
      assert String.contains?(cache_control, "max-age=31536000")
      assert String.contains?(cache_control, "immutable")
    end

    test "token generation works for cache-friendly URLs" do
      # Test that tokens are consistent (cache-friendly)
      path = "test-file.jpg"

      token1 = Tokens.gen_get_token(path)
      # Small delay
      Process.sleep(100)
      token2 = Tokens.gen_get_token(path)

      # Tokens should be identical within the same time window
      assert token1 == token2
    end
  end

  describe "OPTIONS request handling" do
    test "OPTIONS requests bypass token verification" do
      conn = conn(:options, "/test-path")
      result = OperatelyLocalMediaStorage.Plug.verify_token(conn, nil)

      assert result == conn
    end

    test "OPTIONS requests with missing path params do not crash" do
      conn = conn(:options, "/test-path")
      conn = %{conn | params: %{}}

      result = OperatelyLocalMediaStorage.Plug.verify_token(conn, nil)

      assert result == conn
    end

    test "OPTIONS requests with no token do not crash" do
      conn = conn(:options, "/test-path")
      conn = %{conn | query_params: %{}, body_params: %{}}

      result = OperatelyLocalMediaStorage.Plug.verify_token(conn, nil)

      assert result == conn
    end

    test "OPTIONS requests return 401 through full plug pipeline" do
      conn =
        conn(:options, "/test-path")
        |> OperatelyLocalMediaStorage.Plug.call(OperatelyLocalMediaStorage.Plug.init([]))

      assert conn.status == 401
      assert conn.resp_body == "Unauthorized"
    end
  end

  describe "nested paths" do
    test "verify_token/2 accepts upload tokens for nested paths" do
      path = "company-transfer-import-artifacts/account/blob"
      token = Tokens.gen_upload_token(path)

      conn =
        conn(:put, "/#{path}?token=#{token}")
        |> Plug.Conn.fetch_query_params()

      conn = %{conn | params: %{"path" => String.split(path, "/")}, body_params: %{}}

      result = OperatelyLocalMediaStorage.Plug.verify_token(conn, nil)

      assert result == conn
    end

    test "PUT requests upload files to nested paths" do
      source = Path.join(System.tmp_dir!(), "local-media-upload-#{System.unique_integer([:positive])}.txt")
      path = "company-transfer-import-artifacts/account/blob"
      destination = "/media/#{path}"
      token = Tokens.gen_upload_token(path)

      File.write!(source, "hello")

      on_exit(fn ->
        File.rm(source)
        File.rm(destination)
        File.rmdir(Path.dirname(destination))
      end)

      conn =
        conn(:put, "/#{path}?token=#{token}")
        |> Plug.Conn.fetch_query_params()

      conn = %{conn | body_params: %{"file" => %{path: source}}}
      conn = OperatelyLocalMediaStorage.Plug.call(conn, OperatelyLocalMediaStorage.Plug.init([]))

      assert conn.status == 200
      assert File.read!(destination) == "hello"
    end
  end
end
