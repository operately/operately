defmodule Operately.Mcp.ResourcesTest do
  use ExUnit.Case, async: true

  alias Operately.Mcp.Resources

  test "parse_scopes defaults to read and write when scope is omitted" do
    assert Resources.parse_scopes(nil) == {:ok, ["mcp:read", "mcp:write"]}
    assert Resources.parse_scopes("") == {:ok, ["mcp:read", "mcp:write"]}
    assert Resources.parse_scopes([]) == {:ok, ["mcp:read", "mcp:write"]}
  end

  test "parse_scopes accepts explicit scopes" do
    assert Resources.parse_scopes("mcp:read") == {:ok, ["mcp:read"]}
    assert Resources.parse_scopes("mcp:write") == {:ok, ["mcp:write"]}
    assert Resources.parse_scopes("mcp:read mcp:write") == {:ok, ["mcp:read", "mcp:write"]}
    assert Resources.parse_scopes(["mcp:write", "mcp:read"]) == {:ok, ["mcp:write", "mcp:read"]}
  end

  test "parse_scopes rejects unknown scopes" do
    assert Resources.parse_scopes("mcp:admin") == {:error, :invalid_scope}
  end

  test "default_scopes includes read and write" do
    assert Resources.default_scopes() == ["mcp:read", "mcp:write"]
    assert Enum.all?(Resources.default_scopes(), &(&1 in Resources.supported_scopes()))
  end

  test "grant_scopes keeps the requested scopes when no access level is chosen" do
    assert Resources.grant_scopes(["mcp:read", "mcp:write"], nil) == {:ok, ["mcp:read", "mcp:write"]}
    assert Resources.grant_scopes(["mcp:write", "mcp:read"], "") == {:ok, ["mcp:read", "mcp:write"]}
    assert Resources.grant_scopes(["mcp:read"], nil) == {:ok, ["mcp:read"]}
  end

  test "grant_scopes can reduce read and write to view only" do
    assert Resources.grant_scopes(["mcp:read", "mcp:write"], "read") == {:ok, ["mcp:read"]}
    assert Resources.grant_scopes(["mcp:read", "mcp:write"], "read_write") == {:ok, ["mcp:read", "mcp:write"]}
  end

  test "grant_scopes does not add a scope the client did not request" do
    assert Resources.grant_scopes(["mcp:read"], "read_write") == {:ok, ["mcp:read"]}
    assert Resources.grant_scopes(["mcp:write"], "read") == {:error, :invalid_request}
    assert Resources.grant_scopes(["mcp:read"], "admin") == {:error, :invalid_request}
  end
end
