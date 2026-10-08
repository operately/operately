defmodule Operately.Analytics.DeliveryTest do
  use Operately.DataCase
  import Mock
  alias Operately.Analytics
  alias Operately.Analytics.Delivery
  alias Operately.Operations.AccountDeleting

  setup do
    Process.put(:oban_testing, :manual)
    previous = Application.get_env(:operately, :conversion_analytics)
    Application.put_env(:operately, :conversion_analytics, enabled: false)
    ctx = %{} |> Factory.add_account(:account) |> Factory.add_account(:creator)
    Application.put_env(:operately, :conversion_analytics, enabled: true, token: "test", host: "https://example.test")
    on_exit(fn -> Application.put_env(:operately, :conversion_analytics, previous) end)
    Analytics.sync_account(ctx.account, %{})
    Analytics.sync_account(ctx.creator, %{})
    event = %{"uuid" => Ecto.UUID.generate(), "event" => "signup_completed", "distinct_id" => ctx.account.id, "timestamp" => "2026-01-01T12:00:00Z", "properties" => %{}}
    {:ok, Map.put(ctx, :job, %Oban.Job{args: %{"event" => event}, attempt: 1, max_attempts: 10})}
  end

  test "does not send a queued event after its account is deleted", ctx do
    assert {:ok, _} = AccountDeleting.run(ctx.account)
    refute Analytics.opted_out?(ctx.account.id)

    with_mock Finch, [:passthrough], request: fn _, _, _ -> {:ok, %Finch.Response{status: 200}} end do
      assert :ok = Delivery.perform(ctx.job)
      refute called(Finch.request(:_, :_, :_))
    end
  end

  test "does not retry an event after its account is deleted", ctx do
    with_mock Finch, [:passthrough], request: fn _, _, _ -> {:ok, %Finch.Response{status: 503}} end do
      assert {:error, {:http, 503}} = Delivery.perform(ctx.job)
      assert {:ok, _} = AccountDeleting.run(ctx.account)
      assert :ok = Delivery.perform(%{ctx.job | attempt: 2})
      assert_called_exactly(Finch.request(:_, :_, :_), 1)
    end
  end

  test "does not send workspace activation after its creator is deleted", ctx do
    job = workspace_activation_job(ctx.job, ctx.creator)
    assert {:ok, _} = AccountDeleting.run(ctx.creator)
    refute Analytics.opted_out?(ctx.creator.id)

    with_mock Finch, [:passthrough], request: fn _, _, _ -> {:ok, %Finch.Response{status: 200}} end do
      assert :ok = Delivery.perform(job)
      refute called(Finch.request(:_, :_, :_))
    end
  end

  test "sends workspace activation when both accounts are active", ctx do
    job = workspace_activation_job(ctx.job, ctx.creator)

    with_mock Finch, [:passthrough], request: fn _, _, _ -> {:ok, %Finch.Response{status: 200}} end do
      assert :ok = Delivery.perform(job)
      assert_called_exactly(Finch.request(:_, :_, :_), 1)
    end
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

  defp workspace_activation_job(job, creator) do
    event = %{job.args["event"] | "event" => "workspace_activated", "properties" => %{"creator_account_id" => creator.id}}
    %{job | args: %{"event" => event}}
  end
end
