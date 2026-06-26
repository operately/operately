defmodule Operately.Mcp.ClientMetadataTest do
  use ExUnit.Case, async: false
  import Mock

  alias Operately.Mcp.ClientMetadata
  alias Operately.Mcp.ClientMetadata.Cache

  @cimd_client_id "https://client.example.com/oauth/client.json"
  @cimd_document %{
    "client_id" => @cimd_client_id,
    "client_name" => "CIMD MCP Client",
    "redirect_uris" => ["https://client.example.com/callback"]
  }

  setup do
    client = %{
      client_id: "chatgpt",
      client_name: "ChatGPT",
      redirect_uris: ["https://chatgpt.example.com/callback"],
      token_endpoint_auth_method: "none"
    }

    previous_clients = Application.get_env(:operately, :mcp_oauth_clients)
    Application.put_env(:operately, :mcp_oauth_clients, [client])
    Cache.clear()

    on_exit(fn ->
      Application.put_env(:operately, :mcp_oauth_clients, previous_clients)
      Cache.clear()
    end)

    %{client: client}
  end

  test "resolves a pre-registered client", %{client: client} do
    assert {:ok, metadata} = ClientMetadata.resolve(client.client_id)
    assert metadata.client_id == client.client_id
    assert metadata.client_name == client.client_name
    assert metadata.redirect_uris == client.redirect_uris
  end

  test "rejects unknown clients without fetching cimd metadata" do
    with_mock Operately.Mcp.ClientMetadata.Fetcher, [],
      fetch: fn _client_id ->
        flunk("expected non-CIMD client ids to skip fetch")
      end do
      assert {:error, :invalid_client} = ClientMetadata.resolve("unknown-client")
    end
  end

  test "rejects unsupported client authentication methods" do
    previous_clients = Application.get_env(:operately, :mcp_oauth_clients)

    Application.put_env(:operately, :mcp_oauth_clients, [
      %{
        client_id: "private-client",
        client_name: "Private Client",
        redirect_uris: ["https://client.example.com/callback"],
        token_endpoint_auth_method: "client_secret_post"
      }
    ])

    on_exit(fn ->
      Application.put_env(:operately, :mcp_oauth_clients, previous_clients)
    end)

    assert {:error, :unsupported_client_authentication} = ClientMetadata.resolve("private-client")
  end

  test "resolves a cimd client from fetched metadata" do
    with_mock Operately.Mcp.ClientMetadata.Fetcher, [],
      fetch: fn client_id ->
        assert client_id == @cimd_client_id
        {:ok, @cimd_document}
      end do
      assert {:ok, metadata} = ClientMetadata.resolve(@cimd_client_id)
      assert metadata.client_id == @cimd_client_id
      assert metadata.client_name == "CIMD MCP Client"
      assert metadata.redirect_uris == ["https://client.example.com/callback"]
    end
  end

  test "resolves a cimd client from cached metadata" do
    Application.put_env(:operately, :mcp_oauth_clients, [])
    assert :ok = Cache.put(@cimd_client_id, @cimd_document, 60)

    assert {:ok, metadata} = ClientMetadata.resolve(@cimd_client_id)
    assert metadata.client_name == "CIMD MCP Client"
  end

  test "maps cimd fetch failures to invalid_client" do
    with_mock Operately.Mcp.ClientMetadata.Fetcher, [],
      fetch: fn _client_id -> {:error, :fetch_failed} end do
      assert {:error, :invalid_client} = ClientMetadata.resolve(@cimd_client_id)
    end
  end

  test "maps cimd document client_id mismatch to invalid_client" do
    mismatched_document = Map.put(@cimd_document, "client_id", "https://other.example.com/oauth/client.json")

    with_mock Operately.Mcp.ClientMetadata.Fetcher, [],
      fetch: fn _client_id -> {:ok, mismatched_document} end do
      assert {:error, :invalid_client} = ClientMetadata.resolve(@cimd_client_id)
    end
  end

  test "prefers allowlist metadata over cimd documents for the same client_id" do
    allowlisted_client = %{
      client_id: @cimd_client_id,
      client_name: "Allowlisted Client",
      redirect_uris: ["https://client.example.com/callback"],
      token_endpoint_auth_method: "none"
    }

    Application.put_env(:operately, :mcp_oauth_clients, [allowlisted_client])
    assert :ok = Cache.put(@cimd_client_id, @cimd_document, 60)

    with_mock Operately.Mcp.ClientMetadata.Fetcher, [],
      fetch: fn _client_id ->
        flunk("expected allowlisted client to skip fetch")
      end do
      assert {:ok, metadata} = ClientMetadata.resolve(@cimd_client_id)
      assert metadata.client_name == "Allowlisted Client"
    end
  end

  test "rejects redirect uris not listed in resolved cimd metadata" do
    with_mock Operately.Mcp.ClientMetadata.Fetcher, [],
      fetch: fn _client_id -> {:ok, @cimd_document} end do
      assert {:ok, metadata} = ClientMetadata.resolve(@cimd_client_id)
      assert {:error, :invalid_redirect_uri} = ClientMetadata.validate_redirect_uri(metadata, "https://evil.example.com/callback")
    end
  end
end
