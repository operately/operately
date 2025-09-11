defmodule OperatelyEE.BeaconCollectorTest do
  use Operately.DataCase
  use Plug.Test

  import Mock
  alias OperatelyEE.BeaconCollector

  @valid_beacon_data %{
    "installation_id" => "test-id",
    "version" => "0.1.0"
  }

  describe "init/1" do
    test "returns options unchanged" do
      opts = %{some: :option}
      assert BeaconCollector.init(opts) == opts
    end
  end

  describe "call/2 when beacon collector is enabled" do
    setup do
      # Enable beacon collector for these tests
      Application.put_env(:operately, :beacon_collector_enabled, true)
      Application.put_env(:operately, :posthog_api_key, "test_api_key")

      on_exit(fn ->
        Application.delete_env(:operately, :beacon_collector_enabled)
        Application.delete_env(:operately, :posthog_api_key)
      end)
    end

    test "returns 200 OK and processes beacon data successfully" do
      with_mock Finch,
        build: fn _method, _url, _body, _headers -> {:ok, nil} end,
        request: fn _req, _finch, _opts -> {:ok, %Finch.Response{status: 200, body: "ok"}} end
      do
        conn =
          :post
          |> conn("/beacon", @valid_beacon_data)
          |> put_req_header("content-type", "application/json")
          |> BeaconCollector.call([])

        assert conn.status == 200
        assert conn.resp_body == "OK"
        assert conn.halted == true

        expected_headers = [{"content-type", "application/json"}]
        expected_body = Jason.encode!(
          %{
            api_key: "test_api_key",
            event: "self_hosted_beacon",
            distinct_id: @valid_beacon_data["installation_id"],
            properties: %{
              operately_version: @valid_beacon_data["version"]
            }
          }
        )

        assert_called Finch.build(:post, "https://us.i.posthog.com/i/v0/e/", expected_headers, expected_body)
        assert_called Finch.request(:_, Operately.Finch, [receive_timeout: 10_000])
      end
    end

    test "returns 200 OK even when PostHog request fails" do
      with_mock Finch,
        build: fn _method, _url, _body, _headers -> {:ok, nil} end,
        request: fn _req, _finch, _opts -> {:error, :timeout} end
      do
        conn =
          :post
          |> conn("/beacon", @valid_beacon_data)
          |> put_req_header("content-type", "application/json")
          |> BeaconCollector.call([])

        assert conn.status == 200
        assert conn.resp_body == "OK"
        assert conn.halted == true
      end
    end
  end

  describe "call/2 when beacon collector is disabled" do
    setup do
      # Disable beacon collector for these tests
      Application.put_env(:operately, :beacon_collector_enabled, false)

      on_exit(fn ->
        Application.delete_env(:operately, :beacon_collector_enabled)
      end)
    end

    test "returns 404 Not Found when beacon collector is disabled" do
      conn =
        :post
        |> conn("/beacon", @valid_beacon_data)
        |> put_req_header("content-type", "application/json")
        |> BeaconCollector.call([])

      assert conn.status == 404
      assert conn.resp_body == "Not Found"
      assert conn.halted == true
    end

    test "does not attempt to send data to PostHog when disabled" do
      with_mock Finch, request: fn _req, _finch, _opts ->
        {:ok, %Finch.Response{status: 200, body: "ok"}}
      end do
        :post
        |> conn("/beacon", @valid_beacon_data)
        |> put_req_header("content-type", "application/json")
        |> BeaconCollector.call([])

        # Verify that Finch.request was never called
        assert_not_called Finch.request(:_, :_, :_)
      end
    end
  end
end
