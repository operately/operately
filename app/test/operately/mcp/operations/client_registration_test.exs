defmodule Operately.Mcp.Operations.ClientRegistrationTest do
  use Operately.DataCase, async: true

  alias Operately.Mcp.ClientMetadata
  alias Operately.Mcp.OAuthClient
  alias Operately.Mcp.Operations.ClientRegistration
  alias Operately.Repo

  test "registers a public client with loopback redirect uris" do
    params = %{
      "client_name" => "Cursor",
      "redirect_uris" => [
        "cursor://anysphere.cursor-mcp/oauth/callback",
        "https://www.cursor.com/agents/mcp/oauth/callback"
      ],
      "token_endpoint_auth_method" => "none"
    }

    assert {:ok, response} = ClientRegistration.register(params)
    assert is_binary(response.client_id)
    assert response.client_name == "Cursor"
    assert response.token_endpoint_auth_method == "none"
    assert response.grant_types == ["authorization_code"]
    assert response.response_types == ["code"]

    assert %OAuthClient{} = Repo.get(OAuthClient, response.client_id)
  end

  test "registers codex-style loopback redirect uris" do
    params = %{
      "client_name" => "Codex",
      "redirect_uris" => ["http://127.0.0.1:5555/callback/abc123"],
      "token_endpoint_auth_method" => "none"
    }

    assert {:ok, response} = ClientRegistration.register(params)
    assert {:ok, metadata} = ClientMetadata.resolve(response.client_id)
    assert metadata.redirect_uris == ["http://127.0.0.1:5555/callback/abc123"]
  end

  test "rejects unsupported client authentication methods" do
    params = %{
      "client_name" => "Confidential Client",
      "redirect_uris" => ["http://127.0.0.1:4567/callback"],
      "token_endpoint_auth_method" => "client_secret_post"
    }

    assert {:error, :unsupported_client_authentication} = ClientRegistration.register(params)
  end

  test "rejects insecure redirect uris" do
    params = %{
      "client_name" => "Bad Client",
      "redirect_uris" => ["http://client.example.com/callback"],
      "token_endpoint_auth_method" => "none"
    }

    assert {:error, :invalid_redirect_uri} = ClientRegistration.register(params)
  end
end
