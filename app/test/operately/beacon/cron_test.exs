defmodule Operately.Beacon.CronTest do
  use Operately.DataCase
  import Mock

  alias Operately.Support.Factory

  describe "perform/1 when beacon is enabled" do
    setup do
      Application.put_env(:operately, :beacon_enabled, true)

      on_exit(fn ->
        Application.delete_env(:operately, :beacon_enabled)
      end)
    end

    test "sends beacon with company data when companies exist" do
      ctx =
        Factory.setup(%{})
        |> Factory.add_company_member(:john)
        |> Factory.add_company_member(:jane)

      with_mock Finch, build: fn _, _, _, _ -> {:ok, nil} end, request: fn _req, _finch, _opts -> {:ok, %Finch.Response{status: 200, body: "ok"}} end do
        assert :ok = Operately.Beacon.Cron.perform(%{})

        expected_headers = [{"content-type", "application/json"}]

        expected_body =
          Jason.encode!(%{
            version: Operately.version(),
            installation_id: Operately.installation_id(),
            companies: [
              %{
                name: ctx.company.name,
                user_count: 3
              }
            ]
          })

        assert_called(Finch.build(:post, "https://app.operately.com/analytics/beacons", expected_headers, expected_body))
        assert_called(Finch.request(:_, Operately.Finch, receive_timeout: 5_000))
      end
    end

    test "sends beacon with multiple companies" do
      Factory.setup(%{})
      |> Factory.add_company_member(:john)

      Factory.setup(%{})
      |> Factory.add_company_member(:alice)
      |> Factory.add_company_member(:bob)

      with_mock Finch, build: fn _method, _url, _headers, body -> {:ok, body} end, request: fn _req, _finch, _opts -> {:ok, %Finch.Response{status: 200, body: "ok"}} end do
        assert :ok = Operately.Beacon.Cron.perform(%{})

        assert_called(Finch.build(:post, "https://app.operately.com/analytics/beacons", :_, :_))

        [{_, {Finch, :build, [_method, _url, headers, body]}, _} | _] = :meck.history(Finch)

        assert headers == [{"content-type", "application/json"}]

        decoded_body = Jason.decode!(body, keys: :atoms)
        assert decoded_body.version == Operately.version()
        assert decoded_body.installation_id == Operately.installation_id()
        assert length(decoded_body.companies) == 2

        user_counts = Enum.map(decoded_body.companies, & &1.user_count) |> Enum.sort()
        assert user_counts == [2, 3]

        assert Enum.all?(decoded_body.companies, &(&1.name == "Acme Inc."))
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
