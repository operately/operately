defmodule Operately.Mcp.ResourcesTest do
  use ExUnit.Case, async: true

  alias Operately.Mcp.Resources

  test "parse_scopes defaults to read-only when scope is omitted" do
    assert Resources.parse_scopes(nil) == {:ok, ["mcp:read"]}
    assert Resources.parse_scopes("") == {:ok, ["mcp:read"]}
    assert Resources.parse_scopes([]) == {:ok, ["mcp:read"]}
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

  test "default_scopes is read-only" do
    assert Resources.default_scopes() == ["mcp:read"]
    assert Enum.all?(Resources.default_scopes(), &(&1 in Resources.supported_scopes()))
  end
end
