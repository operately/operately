defmodule Operately.Analytics.DeliveryTest do
  use Operately.DataCase
  import Mock
  alias Operately.Analytics.Delivery

  setup do
    previous = Application.get_env(:operately, :conversion_analytics)
    Application.put_env(:operately, :conversion_analytics, enabled: true, token: "test", host: "https://example.test")
    on_exit(fn -> Application.put_env(:operately, :conversion_analytics, previous) end)
    event = %{"uuid" => Ecto.UUID.generate(), "event" => "signup_completed", "distinct_id" => Ecto.UUID.generate(), "timestamp" => "2026-01-01T12:00:00Z", "properties" => %{}}
    {:ok, job: %Oban.Job{args: %{"event" => event}, attempt: 1, max_attempts: 10}}
  end

  test "retries keep identical event ID, timestamp, and payload", %{job: job} do
    parent = self()

    with_mock Finch, [:passthrough],
      request: fn request, _, _ ->
        send(parent, {:payload, Jason.decode!(request.body)})
        {:ok, %Finch.Response{status: 503}}
      end do
      assert {:error, {:http, 503}} = Delivery.perform(job)
      assert {:error, {:http, 503}} = Delivery.perform(%{job | attempt: 2})
      assert_receive {:payload, first}
      assert_receive {:payload, second}
      assert first == second
      assert first["uuid"] == job.args["event"]["uuid"]
      assert first["timestamp"] == job.args["event"]["timestamp"]
    end
  end

  test "rate limits retry, invalid requests cancel, and success completes", %{job: job} do
    for {status, expected} <- [{429, {:error, {:http, 429}}}, {400, {:cancel, {:http, 400}}}, {200, :ok}] do
      with_mock Finch, [:passthrough], request: fn _, _, _ -> {:ok, %Finch.Response{status: status}} end do
        assert Delivery.perform(job) == expected
      end
    end
  end

  test "transport failure is retryable without exposing payloads", %{job: job} do
    with_mock Finch, [:passthrough], request: fn _, _, _ -> {:error, :closed} end do
      assert {:error, :transport_error} = Delivery.perform(job)
    end
  end
end
