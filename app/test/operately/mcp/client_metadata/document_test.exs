defmodule Operately.Mcp.ClientMetadata.DocumentTest do
  use ExUnit.Case, async: true

  alias Operately.Mcp.ClientMetadata
  alias Operately.Mcp.ClientMetadata.Document

  @client_id "https://client.example.com/oauth/client.json"

  describe "cimd_client_id?/1" do
    test "accepts an https metadata url with a path" do
      assert Document.cimd_client_id?(@client_id)
    end

    test "rejects bare client ids" do
      refute Document.cimd_client_id?("chatgpt")
    end

    test "rejects urls without a path" do
      refute Document.cimd_client_id?("https://client.example.com")
      refute Document.cimd_client_id?("https://client.example.com/")
    end

    test "rejects http urls" do
      refute Document.cimd_client_id?("http://client.example.com/oauth/client.json")
      refute Document.cimd_client_id?("http://localhost/oauth/client.json")
      refute Document.cimd_client_id?("http://127.0.0.1/oauth/client.json")
    end
  end

  describe "parse/2" do
    test "parses a valid document" do
      document = %{
        "client_id" => @client_id,
        "client_name" => "Example MCP Client",
        "client_uri" => "https://client.example.com",
        "logo_uri" => "https://client.example.com/logo.png",
        "redirect_uris" => ["https://client.example.com/callback"],
        "token_endpoint_auth_method" => "none"
      }

      assert {:ok, metadata} = Document.parse(@client_id, document)

      assert %ClientMetadata{
               client_id: @client_id,
               client_name: "Example MCP Client",
               client_uri: "https://client.example.com",
               logo_uri: "https://client.example.com/logo.png",
               redirect_uris: ["https://client.example.com/callback"],
               token_endpoint_auth_method: "none"
             } = metadata
    end

    test "normalizes trailing slashes in client_id" do
      document = %{
        "client_id" => @client_id,
        "client_name" => "Example MCP Client",
        "redirect_uris" => ["https://client.example.com/callback"]
      }

      assert {:ok, metadata} =
               Document.parse(@client_id <> "/", %{
                 document
                 | "client_id" => @client_id <> "/"
               })

      assert metadata.client_id == @client_id
    end

    test "rejects missing required fields" do
      assert {:error, :invalid_client_metadata} =
               Document.parse(@client_id, %{
                 "client_name" => "Example MCP Client",
                 "redirect_uris" => ["https://client.example.com/callback"]
               })

      assert {:error, :invalid_client_metadata} =
               Document.parse(@client_id, %{
                 "client_id" => @client_id,
                 "redirect_uris" => ["https://client.example.com/callback"]
               })

      assert {:error, :invalid_client_metadata} =
               Document.parse(@client_id, %{
                 "client_id" => @client_id,
                 "client_name" => "Example MCP Client"
               })
    end

    test "rejects empty required fields" do
      assert {:error, :invalid_client_metadata} =
               Document.parse(@client_id, %{
                 "client_id" => "",
                 "client_name" => "Example MCP Client",
                 "redirect_uris" => ["https://client.example.com/callback"]
               })
    end

    test "rejects client_id mismatch" do
      assert {:error, :invalid_client_metadata} =
               Document.parse(@client_id, %{
                 "client_id" => "https://other.example.com/oauth/client.json",
                 "client_name" => "Example MCP Client",
                 "redirect_uris" => ["https://client.example.com/callback"]
               })
    end

    test "rejects invalid redirect_uris" do
      assert {:error, :invalid_client_metadata} =
               Document.parse(@client_id, %{
                 "client_id" => @client_id,
                 "client_name" => "Example MCP Client",
                 "redirect_uris" => []
               })

      assert {:error, :invalid_client_metadata} =
               Document.parse(@client_id, %{
                 "client_id" => @client_id,
                 "client_name" => "Example MCP Client",
                 "redirect_uris" => "https://client.example.com/callback"
               })

      assert {:error, :invalid_client_metadata} =
               Document.parse(@client_id, %{
                 "client_id" => @client_id,
                 "client_name" => "Example MCP Client",
                 "redirect_uris" => [123]
               })
    end

    test "defaults omitted token endpoint auth method to none" do
      assert {:ok, metadata} =
               Document.parse(@client_id, %{
                 "client_id" => @client_id,
                 "client_name" => "Example MCP Client",
                 "redirect_uris" => ["https://client.example.com/callback"]
               })

      assert metadata.token_endpoint_auth_method == "none"
    end

    test "accepts a preferred private_key_jwt method when none is also supported" do
      assert {:ok, metadata} =
               Document.parse(@client_id, %{
                 "client_id" => @client_id,
                 "client_name" => "ChatGPT",
                 "redirect_uris" => ["https://chatgpt.com/connector/oauth/example"],
                 "token_endpoint_auth_method" => "private_key_jwt",
                 "token_endpoint_auth_methods_supported" => ["none", "private_key_jwt"]
               })

      assert metadata.token_endpoint_auth_method == "none"
    end

    test "rejects unsupported client authentication methods" do
      assert {:error, :unsupported_client_authentication} =
               Document.parse(@client_id, %{
                 "client_id" => @client_id,
                 "client_name" => "Example MCP Client",
                 "redirect_uris" => ["https://client.example.com/callback"],
                 "token_endpoint_auth_method" => "client_secret_post"
               })
    end

    test "rejects private_key_jwt when none is not a supported fallback" do
      assert {:error, :unsupported_client_authentication} =
               Document.parse(@client_id, %{
                 "client_id" => @client_id,
                 "client_name" => "ChatGPT",
                 "redirect_uris" => ["https://chatgpt.com/connector/oauth/example"],
                 "token_endpoint_auth_method" => "private_key_jwt",
                 "token_endpoint_auth_methods_supported" => ["private_key_jwt"]
               })
    end
  end

  describe "redirect_uris scheme validation" do
    setup do
      previous = Application.get_env(:operately, :mcp_cimd_require_https_redirect_uris)

      on_exit(fn ->
        if previous == nil do
          Application.delete_env(:operately, :mcp_cimd_require_https_redirect_uris)
        else
          Application.put_env(:operately, :mcp_cimd_require_https_redirect_uris, previous)
        end
      end)

      :ok
    end

    test "requires https redirect uris for public hosts" do
      Application.put_env(:operately, :mcp_cimd_require_https_redirect_uris, true)

      base = %{
        "client_id" => @client_id,
        "client_name" => "Example MCP Client"
      }

      assert {:error, :invalid_client_metadata} =
               Document.parse(@client_id, Map.put(base, "redirect_uris", ["http://client.example.com/callback"]))

      assert {:ok, _metadata} =
               Document.parse(@client_id, Map.put(base, "redirect_uris", ["http://localhost:4567/callback"]))

      assert {:ok, _metadata} =
               Document.parse(@client_id, Map.put(base, "redirect_uris", ["http://127.0.0.1:54321/callback/id"]))

      assert {:ok, _metadata} =
               Document.parse(@client_id, Map.put(base, "redirect_uris", ["https://client.example.com/callback"]))

      assert {:ok, _metadata} =
               Document.parse(@client_id, Map.put(base, "redirect_uris", ["cursor://anysphere.cursor-mcp/oauth/callback"]))
    end

    test "allows localhost http redirect uris outside production mode" do
      Application.put_env(:operately, :mcp_cimd_require_https_redirect_uris, false)

      base = %{
        "client_id" => @client_id,
        "client_name" => "Example MCP Client"
      }

      assert {:ok, _metadata} =
               Document.parse(@client_id, Map.put(base, "redirect_uris", ["http://localhost:4567/callback"]))

      assert {:ok, _metadata} =
               Document.parse(@client_id, Map.put(base, "redirect_uris", ["http://127.0.0.1/callback"]))

      assert {:ok, _metadata} =
               Document.parse(@client_id, Map.put(base, "redirect_uris", ["https://client.example.com/callback"]))

      assert {:error, :invalid_client_metadata} =
               Document.parse(@client_id, Map.put(base, "redirect_uris", ["http://client.example.com/callback"]))
    end
  end
end
