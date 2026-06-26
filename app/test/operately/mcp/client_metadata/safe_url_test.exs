defmodule Operately.Mcp.ClientMetadata.SafeUrlTest do
  use ExUnit.Case, async: false

  alias Operately.Mcp.ClientMetadata.SafeUrl

  @client_id "https://client.example.com/oauth/client.json"

  setup do
    previous_lookup = Application.get_env(:operately, :mcp_cimd_dns_lookup)

    on_exit(fn ->
      Application.put_env(:operately, :mcp_cimd_dns_lookup, previous_lookup)
    end)

    %{previous_lookup: previous_lookup}
  end

  test "accepts a public https metadata url", %{previous_lookup: _} do
    Application.put_env(:operately, :mcp_cimd_dns_lookup, fn _host ->
      {:ok, {:hostent, ~c"client.example.com", [], :inet, 4, [{93, 184, 216, 34}]}}
    end)

    assert :ok = SafeUrl.validate(@client_id)
  end

  test "rejects http urls" do
    assert {:error, :unsafe_url} = SafeUrl.validate("http://client.example.com/oauth/client.json")
  end

  test "rejects localhost hostnames" do
    assert {:error, :unsafe_url} = SafeUrl.validate("https://localhost/oauth/client.json")
  end

  test "rejects literal private ip hosts" do
    assert {:error, :unsafe_url} = SafeUrl.validate("https://127.0.0.1/oauth/client.json")
    assert {:error, :unsafe_url} = SafeUrl.validate("https://10.0.0.1/oauth/client.json")
    assert {:error, :unsafe_url} = SafeUrl.validate("https://192.168.1.1/oauth/client.json")
  end

  test "rejects non-default https ports" do
    assert {:error, :unsafe_url} = SafeUrl.validate("https://client.example.com:8443/oauth/client.json")
  end

  test "rejects hostnames that resolve to private addresses" do
    Application.put_env(:operately, :mcp_cimd_dns_lookup, fn _host ->
      {:ok, {:hostent, ~c"client.example.com", [], :inet, 4, [{127, 0, 0, 1}]}}
    end)

    assert {:error, :unsafe_url} = SafeUrl.validate(@client_id)
  end
end
