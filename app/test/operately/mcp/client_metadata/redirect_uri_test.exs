defmodule Operately.Mcp.ClientMetadata.RedirectUriTest do
  use ExUnit.Case, async: true

  alias Operately.Mcp.ClientMetadata.RedirectUri

  test "allows public https redirect uris" do
    assert RedirectUri.allowed?("https://client.example.com/callback")
    assert RedirectUri.allowed?("https://chatgpt.com/aip/oauth/callback")
    assert RedirectUri.allowed?("https://www.cursor.com/agents/mcp/oauth/callback")
  end

  test "allows loopback redirect uris for ide and cli clients" do
    assert RedirectUri.allowed?("http://127.0.0.1:54321/callback/abc123")
    assert RedirectUri.allowed?("http://localhost:4567/callback")
    assert RedirectUri.allowed?("http://[::1]:8080/callback")
  end

  test "allows native app redirect uris with oauth callback paths" do
    assert RedirectUri.allowed?("cursor://anysphere.cursor-mcp/oauth/callback")
    assert RedirectUri.allowed?("cursor://anysphere.cursor-mcp/oauth/callback/workspace-id")
    assert RedirectUri.allowed?("vscode://vscode.github-authentication/oauth/callback")
    assert RedirectUri.allowed?("windsurf://windsurf.oauth/callback")
    assert RedirectUri.allowed?("trae://trae.mcp/oauth/callback/id")
  end

  test "rejects insecure non-loopback http redirect uris" do
    refute RedirectUri.allowed?("http://client.example.com/callback")
    refute RedirectUri.allowed?("http://evil.example.com/oauth/callback")
  end

  test "rejects dangerous or malformed native redirect uris" do
    refute RedirectUri.allowed?("javascript:alert(1)")
    refute RedirectUri.allowed?("data:text/html,oauth/callback")
    refute RedirectUri.allowed?("file:///oauth/callback")
    refute RedirectUri.allowed?("custom://callback")
    refute RedirectUri.allowed?("myapp://vendor.example/settings")
    refute RedirectUri.allowed?("cursor://anysphere.cursor-mcp/not-a-callback")
  end

  test "validate_all/1 requires a non-empty allowed list" do
    assert :ok = RedirectUri.validate_all(["https://client.example.com/callback"])
    assert {:error, :invalid_redirect_uri} = RedirectUri.validate_all([])
    assert {:error, :invalid_redirect_uri} = RedirectUri.validate_all(["http://client.example.com/callback"])
  end
end
