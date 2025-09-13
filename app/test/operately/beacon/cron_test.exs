defmodule Operately.Beacon.CronTest do
  use Operately.DataCase
  import Mock

  describe "perform/1 when beacon is enabled" do
    setup do
      Application.put_env(:operately, :beacon_enabled, true)

      on_exit(fn ->
        Application.delete_env(:operately, :beacon_enabled)
      end)
    end

    test "sends beacon successfully when Finch request succeeds" do
      with_mock Finch, build: fn _, _, _, _ -> {:ok, nil} end, request: fn _req, _finch, _opts -> {:ok, %Finch.Response{status: 200, body: "ok"}} end do
        assert :ok = Operately.Beacon.Cron.perform(%{})

        expected_headers = [{"content-type", "application/json"}]

        expected_body =
          Jason.encode!(%{
            version: Operately.version(),
            installation_id: Operately.installation_id()
          })

        assert_called(Finch.build(:post, "https://app.operately.com/analytics/beacons", expected_headers, expected_body))
        assert_called(Finch.request(:_, Operately.Finch, receive_timeout: 5_000))
      end
    end
  end

  describe "perform/1 when beacon is not enabled" do
    setup do
      Application.put_env(:operately, :beacon_enabled, false)

      on_exit(fn ->
        Application.delete_env(:operately, :beacon_enabled)
      end)
    end

    test "does not send beacon when Finch request succeeds" do
      with_mock Finch, build: fn _, _, _, _ -> {:ok, nil} end, request: fn _req, _finch, _opts -> {:ok, %Finch.Response{status: 200, body: "ok"}} end do
        assert :ok = Operately.Beacon.Cron.perform(%{})

        assert_not_called(Finch.build(:post, :_, :_, :_))
        assert_not_called(Finch.request(:_, :_, :_))
      end
    end
  end
end
