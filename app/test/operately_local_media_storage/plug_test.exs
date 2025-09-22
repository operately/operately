defmodule OperatelyLocalMediaStorage.PlugTest do
  use ExUnit.Case, async: true
  use Plug.Test

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
end
