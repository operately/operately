defmodule Operately.Mcp.ClientMetadataTest do
  use ExUnit.Case, async: false

  alias Operately.Mcp.ClientMetadata

  setup do
    client = %{
      client_id: "chatgpt",
      client_name: "ChatGPT",
      redirect_uris: ["https://chatgpt.example.com/callback"],
      token_endpoint_auth_method: "none"
    }

    previous_clients = Application.get_env(:operately, :mcp_oauth_clients)
    Application.put_env(:operately, :mcp_oauth_clients, [client])

    on_exit(fn ->
      Application.put_env(:operately, :mcp_oauth_clients, previous_clients)
    end)

    %{client: client}
  end

  test "resolves a pre-registered client", %{client: client} do
    assert {:ok, metadata} = ClientMetadata.resolve(client.client_id)
    assert metadata.client_id == client.client_id
    assert metadata.client_name == client.client_name
    assert metadata.redirect_uris == client.redirect_uris
  end

  test "rejects unknown clients" do
    assert {:error, :invalid_client} = ClientMetadata.resolve("unknown-client")
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
end
