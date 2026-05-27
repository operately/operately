defmodule Operately.Billing.Polar.ProcessWebhookWorkerTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  import ExUnit.CaptureLog
  import Mock

  alias Operately.Billing
  alias Operately.Billing.WebhookEvent
  alias Operately.Billing.Polar.ProcessWebhookWorker
  alias Operately.Repo

  setup do
    telemetry_handler_id = "process-webhook-worker-test-#{System.unique_integer([:positive])}"

    :telemetry.attach_many(
      telemetry_handler_id,
      [
        [:operately, :billing, :webhook, :process, :stop],
        [:operately, :billing, :webhook, :process, :retry]
      ],
      &__MODULE__.handle_telemetry_event/4,
      self()
    )

    on_exit(fn ->
      :telemetry.detach(telemetry_handler_id)
    end)

    {:ok, Factory.setup(%{})}
  end

  describe "perform/1" do
    test "syncs customer state, clears matching pending checkout, and marks the webhook processed", ctx do
      {:ok, _current_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_team_monthly"
        })

      {:ok, _scheduled_product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "business",
          billing_interval: "yearly",
          polar_product_id: "prod_business_yearly"
        })

      {:ok, account} = Billing.get_or_create_billing_account(ctx.company)
      {:ok, _account} = Billing.set_pending_checkout(account, :team, :monthly)

      webhook_event =
        create_webhook_event(%{
          payload: %{
            "type" => "customer.state_changed",
            "data" => %{"external_id" => ctx.company.id}
          }
        })

      topic = "api:billing_updated:#{ctx.company.id}"
      OperatelyWeb.Endpoint.subscribe(topic)

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn company_id ->
          assert company_id == ctx.company.id

          {:ok,
           %{
             "subscriptions" => [
               %{
                 "id" => "sub_123",
                 "status" => "active",
                 "product_id" => "prod_team_monthly",
                 "current_period_end" => "2026-06-30T00:00:00Z",
                 "cancel_at_period_end" => false,
                 "pending_update" => %{"product_id" => "prod_business_yearly"}
               }
             ]
           }}
        end do
        assert :ok = perform_job(ProcessWebhookWorker, %{billing_webhook_event_id: webhook_event.id})
      end

      webhook_event = Repo.reload(webhook_event)
      assert webhook_event.status == :processed
      assert %DateTime{} = webhook_event.processed_at
      assert webhook_event.error == nil
      assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event", payload: %{}}
      assert_receive {:telemetry_event, [:operately, :billing, :webhook, :process, :stop], measurements, metadata}
      assert metadata.result == "processed"
      assert metadata.event_type == "customer.state_changed"
      assert metadata.company_id == ctx.company.id
      assert measurements.duration >= 0
      assert measurements.lag_ms >= 0

      account = Billing.get_billing_account_by_company(ctx.company)
      assert account.status == :active
      assert account.plan_key == :team
      assert account.billing_interval == :monthly
      assert account.pending_plan_key == nil
      assert account.pending_billing_interval == nil
      assert account.pending_checkout_started_at == nil
      assert account.scheduled_plan_key == :business
      assert account.scheduled_billing_interval == :yearly
      assert account.scheduled_change_effective_at == ~U[2026-06-30 00:00:00Z]
    end

    test "returns success when the webhook row no longer exists" do
      assert :ok = perform_job(ProcessWebhookWorker, %{billing_webhook_event_id: Ecto.UUID.generate()})
    end

    test "returns success without syncing when the webhook row is already processed", ctx do
      webhook_event =
        create_webhook_event(%{
          status: :processed,
          processed_at: ~U[2026-05-01 00:00:00Z],
          payload: %{
            "type" => "customer.state_changed",
            "data" => %{"external_id" => ctx.company.id}
          }
        })

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          flunk("expected processed webhook rows to be ignored")
        end do
        assert :ok = perform_job(ProcessWebhookWorker, %{billing_webhook_event_id: webhook_event.id})
      end

      webhook_event = Repo.reload(webhook_event)
      assert webhook_event.status == :processed
      assert webhook_event.processed_at == ~U[2026-05-01 00:00:00Z]
      assert webhook_event.error == nil
    end

    test "marks unsupported event types as processed without syncing" do
      webhook_event =
        create_webhook_event(%{
          event_type: "customer.updated",
          payload: %{
            "type" => "customer.updated",
            "data" => %{"external_id" => Ecto.UUID.generate()}
          }
        })

      with_mock Operately.Billing.Polar.Client, [:passthrough],
        get_customer_state_by_external_id: fn _company_id ->
          flunk("expected unsupported webhook event types to skip provider sync")
        end do
        assert :ok = perform_job(ProcessWebhookWorker, %{billing_webhook_event_id: webhook_event.id})
      end

      webhook_event = Repo.reload(webhook_event)
      assert webhook_event.status == :processed
      assert %DateTime{} = webhook_event.processed_at
      assert webhook_event.error == nil
      refute_receive %Phoenix.Socket.Broadcast{topic: "api:billing_updated:" <> _}
      assert_receive {:telemetry_event, [:operately, :billing, :webhook, :process, :stop], measurements, metadata}
      assert metadata.result == "ignored"
      assert metadata.event_type == "customer.updated"
      assert measurements.duration >= 0
      assert measurements.lag_ms >= 0
    end

    test "marks the webhook failed and discards it when external_id is missing" do
      webhook_event =
        create_webhook_event(%{
          payload: %{
            "type" => "customer.state_changed",
            "data" => %{}
          }
        })

      log =
        capture_log(fn ->
          assert {:discard, "missing_external_id"} = perform_job(ProcessWebhookWorker, %{billing_webhook_event_id: webhook_event.id})
        end)

      webhook_event = Repo.reload(webhook_event)
      assert webhook_event.status == :failed
      assert webhook_event.processed_at == nil
      assert webhook_event.error == "missing_external_id"
      assert_receive {:telemetry_event, [:operately, :billing, :webhook, :process, :stop], measurements, metadata}
      assert metadata.result == "discarded"
      assert metadata.reason == "missing_external_id"
      assert measurements.duration >= 0
      assert measurements.lag_ms >= 0
      assert log =~ "Polar webhook processing discarded"
      assert log =~ "missing_external_id"
    end

    test "marks the webhook failed and discards it when the local company does not exist" do
      webhook_event =
        create_webhook_event(%{
          payload: %{
            "type" => "customer.state_changed",
            "data" => %{"external_id" => Ecto.UUID.generate()}
          }
        })

      assert {:discard, "company_not_found"} = perform_job(ProcessWebhookWorker, %{billing_webhook_event_id: webhook_event.id})

      webhook_event = Repo.reload(webhook_event)
      assert webhook_event.status == :failed
      assert webhook_event.processed_at == nil
      assert webhook_event.error == "company_not_found"
    end

    test "marks the webhook failed and returns a retryable error when Polar sync fails", ctx do
      webhook_event =
        create_webhook_event(%{
          payload: %{
            "type" => "customer.state_changed",
            "data" => %{"external_id" => ctx.company.id}
          }
        })

      log =
        capture_log(fn ->
          with_mock Operately.Billing.Polar.Client, [:passthrough],
            get_customer_state_by_external_id: fn _company_id ->
              {:error, :internal_server_error}
            end do
            assert {:error, "internal_server_error"} = perform_job(ProcessWebhookWorker, %{billing_webhook_event_id: webhook_event.id})
          end
        end)

      webhook_event = Repo.reload(webhook_event)
      assert webhook_event.status == :failed
      assert webhook_event.processed_at == nil
      assert webhook_event.error == "internal_server_error"
      refute_receive %Phoenix.Socket.Broadcast{topic: "api:billing_updated:" <> _}
      assert_receive {:telemetry_event, [:operately, :billing, :webhook, :process, :stop], measurements, metadata}
      assert metadata.result == "retryable_failed"
      assert metadata.reason == "internal_server_error"
      assert measurements.duration >= 0
      assert measurements.lag_ms >= 0
      assert log =~ "Polar webhook processing failed"
      assert log =~ "result: \"retryable_failed\""
    end

    test "reprocesses previously failed rows on a later successful retry", ctx do
      {:ok, _product} =
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "prod_team_monthly"
        })

      webhook_event =
        create_webhook_event(%{
          status: :failed,
          error: "old_error",
          payload: %{
            "type" => "customer.state_changed",
            "data" => %{"external_id" => ctx.company.id}
          }
        })

      job = %Oban.Job{
        args: %{"billing_webhook_event_id" => webhook_event.id},
        attempt: 2,
        max_attempts: 20,
        queue: "default"
      }

      log =
        capture_log(fn ->
          with_mock Operately.Billing.Polar.Client, [:passthrough],
            get_customer_state_by_external_id: fn _company_id ->
              {:ok,
               %{
                 "subscriptions" => [
                   %{
                     "id" => "sub_retry",
                     "status" => "active",
                     "product_id" => "prod_team_monthly",
                     "current_period_end" => "2026-06-30T00:00:00Z",
                     "cancel_at_period_end" => false
                   }
                 ]
               }}
            end do
            assert :ok = ProcessWebhookWorker.perform(job)
          end
        end)

      webhook_event = Repo.reload(webhook_event)
      assert webhook_event.status == :processed
      assert %DateTime{} = webhook_event.processed_at
      assert webhook_event.error == nil
      assert_receive {:telemetry_event, [:operately, :billing, :webhook, :process, :retry], %{count: 1}, retry_metadata}
      assert retry_metadata.provider == "polar"
      assert retry_metadata.event_type == "customer.state_changed"
      assert retry_metadata.attempt == 2
      assert retry_metadata.max_attempts == 20
      assert retry_metadata.queue == "default"
      assert_receive {:telemetry_event, [:operately, :billing, :webhook, :process, :stop], measurements, metadata}
      assert metadata.result == "processed"
      assert metadata.attempt == 2
      assert metadata.max_attempts == 20
      assert measurements.duration >= 0
      assert measurements.lag_ms >= 0
      assert log =~ "Polar webhook retry"
      assert log =~ "attempt: 2"

      account = Billing.get_billing_account_by_company(ctx.company)
      assert account.status == :active
      assert account.plan_key == :team
      assert account.billing_interval == :monthly
    end
  end

  defp create_webhook_event(attrs) do
    defaults = %{
      provider: "polar",
      event_id: Ecto.UUID.generate(),
      event_type: "customer.state_changed",
      payload: %{
        "type" => "customer.state_changed",
        "data" => %{"external_id" => Ecto.UUID.generate()}
      },
      received_at: DateTime.utc_now() |> DateTime.truncate(:second),
      processed_at: nil,
      status: :pending,
      error: nil
    }

    attrs =
      defaults
      |> Map.merge(attrs)
      |> Map.update!(:status, fn status -> status end)

    %WebhookEvent{}
    |> WebhookEvent.changeset(attrs)
    |> Repo.insert!()
  end

  def handle_telemetry_event(event, measurements, metadata, pid) do
    send(pid, {:telemetry_event, event, measurements, metadata})
  end
end
