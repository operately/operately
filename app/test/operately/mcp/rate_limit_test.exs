defmodule Operately.Mcp.RateLimitTest do
  use ExUnit.Case, async: false

  alias Operately.Mcp.RateLimit

  @ip "203.0.113.10"
  @client_id "https://client.example.com/oauth/client.json"
  @grant_id "grant-123"

  setup do
    previous_limits = Application.get_env(:operately, :mcp_rate_limits)
    previous_enabled = Application.get_env(:operately, :mcp_rate_limits_enabled)

    Application.put_env(:operately, :mcp_rate_limits_enabled, true)
    RateLimit.clear()

    on_exit(fn ->
      Application.put_env(:operately, :mcp_rate_limits, previous_limits)
      Application.put_env(:operately, :mcp_rate_limits_enabled, previous_enabled)
      RateLimit.clear()
    end)

    :ok
  end

  test "allows requests up to the configured limit" do
    put_limits(oauth_authorize: %{limit: 2, period_seconds: 60, keys: [:ip]})

    assert :ok = RateLimit.check(:oauth_authorize, ip: @ip)
    assert :ok = RateLimit.check(:oauth_authorize, ip: @ip)
    assert {:error, retry_after} = RateLimit.check(:oauth_authorize, ip: @ip)
    assert retry_after > 0
  end

  test "rejects the second request when limit is 1" do
    put_limits(oauth_authorize: %{limit: 1, period_seconds: 60, keys: [:ip]})

    assert :ok = RateLimit.check(:oauth_authorize, ip: @ip)
    assert {:error, _} = RateLimit.check(:oauth_authorize, ip: @ip)
  end

  test "tracks separate buckets per key dimension" do
    put_limits(oauth_authorize: %{limit: 1, period_seconds: 60, keys: [:ip]})

    assert :ok = RateLimit.check(:oauth_authorize, ip: "203.0.113.1")
    assert :ok = RateLimit.check(:oauth_authorize, ip: "203.0.113.2")
    assert {:error, _} = RateLimit.check(:oauth_authorize, ip: "203.0.113.1")
  end

  test "checks all configured keys for an action" do
    put_limits(oauth_token: %{limit: 1, period_seconds: 60, keys: [:ip, :client_id]})

    assert :ok = RateLimit.check(:oauth_token, ip: @ip, client_id: @client_id)
    assert {:error, _} = RateLimit.check(:oauth_token, ip: @ip, client_id: "other-client")
    assert {:error, _} = RateLimit.check(:oauth_token, ip: "203.0.113.99", client_id: @client_id)
  end

  test "skips blank optional key values" do
    put_limits(oauth_token: %{limit: 1, period_seconds: 60, keys: [:ip, :client_id]})

    assert :ok = RateLimit.check(:oauth_token, ip: @ip, client_id: "")
    assert {:error, _} = RateLimit.check(:oauth_token, ip: @ip, client_id: "")
  end

  test "resets the counter after the window expires" do
    put_limits(oauth_authorize: %{limit: 1, period_seconds: 1, keys: [:ip]})

    assert :ok = RateLimit.check(:oauth_authorize, ip: @ip)
    assert {:error, _} = RateLimit.check(:oauth_authorize, ip: @ip)

    Process.sleep(1_100)

    assert :ok = RateLimit.check(:oauth_authorize, ip: @ip)
  end

  test "returns :ok when rate limiting is disabled" do
    put_limits(oauth_authorize: %{limit: 1, period_seconds: 60, keys: [:ip]})
    Application.put_env(:operately, :mcp_rate_limits_enabled, false)

    assert :ok = RateLimit.check(:oauth_authorize, ip: @ip)
    assert :ok = RateLimit.check(:oauth_authorize, ip: @ip)
  end

  test "format_ip/1 stringifies tuple addresses" do
    assert RateLimit.format_ip({127, 0, 0, 1}) == "127.0.0.1"
    assert RateLimit.format_ip(nil) == nil
  end

  test "tools_call checks grant bucket" do
    put_limits(tools_call: %{limit: 1, period_seconds: 60, keys: [:grant_id]})

    assert :ok = RateLimit.check(:tools_call, grant_id: @grant_id)
    assert {:error, _} = RateLimit.check(:tools_call, grant_id: @grant_id)
  end

  defp put_limits(overrides) do
    limits =
      Application.get_env(:operately, :mcp_rate_limits)
      |> Map.merge(Map.new(overrides))

    Application.put_env(:operately, :mcp_rate_limits, limits)
  end
end
