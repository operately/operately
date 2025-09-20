defmodule OperatelyLocalMediaStorage.PlugTest do
  use ExUnit.Case, async: true
  use Plug.Test

  alias OperatelyLocalMediaStorage.Plug
  alias Operately.Blobs.Tokens

  describe "GET requests with cache headers" do
    test "sets cache headers on successful file response" do
      # Create a test file
      test_path = "test-cache-file.txt"
      full_path = "/media/#{test_path}"
      File.mkdir_p(Path.dirname(full_path))
      File.write!(full_path, "test content")

      # Generate a valid token
      token = Tokens.gen_get_token(test_path)

      # Make request with proper query params fetching
      conn = 
        conn(:get, "/#{test_path}?token=#{token}")
        |> Plug.Conn.fetch_query_params()
        
      conn = OperatelyLocalMediaStorage.Plug.call(conn, OperatelyLocalMediaStorage.Plug.init([]))

      # Check cache headers are present
      assert [cache_control] = Plug.Conn.get_resp_header(conn, "cache-control")
      assert cache_control == "public, max-age=31536000, immutable"
      
      # Cleanup
      File.rm(full_path)
    end
  end
end