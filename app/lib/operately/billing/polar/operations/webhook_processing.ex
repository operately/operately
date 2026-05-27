defmodule Operately.Billing.Polar.Operations.WebhookProcessing do
  alias Operately.Billing
  alias Operately.Billing.Polar.Operations.CustomerStateSync
  alias Operately.Billing.Polar.WebhookObservability
  alias Operately.Billing.WebhookEvent
  alias Operately.Companies.Company
  alias Operately.Repo
  alias OperatelyWeb.Api.Subscriptions.BillingUpdated

  def run(webhook_event_id, opts \\ [])

  def run(webhook_event_id, _opts) when webhook_event_id in [nil, ""], do: :ok

  def run(webhook_event_id, opts) do
    case Repo.get(WebhookEvent, webhook_event_id) do
      nil ->
        :ok

      %WebhookEvent{status: :processed} ->
        :ok

      %WebhookEvent{} = webhook_event ->
        maybe_emit_retry(webhook_event, Keyword.get(opts, :job))
        process(webhook_event, opts, System.monotonic_time())
    end
  end

  defp process(%WebhookEvent{} = webhook_event, opts, started_at) do
    client = Billing.provider_client(opts)

    with {:ok, webhook_event} <- mark_processing(webhook_event),
         result <- process_event(webhook_event, client) do
      finish(webhook_event, result, started_at, Keyword.get(opts, :job))
    else
      {:error, _changeset} ->
        record_processing(:internal_error, webhook_event, started_at, Keyword.get(opts, :job), %{reason: "mark_processing_failed"})
        {:error, :internal_server_error}
    end
  end

  defp process_event(%WebhookEvent{event_type: "customer.state_changed"} = webhook_event, client) do
    with {:ok, external_id} <- extract_external_id(webhook_event.payload),
         {:ok, %Company{} = company} <- find_company(external_id),
         {:ok, _account} <- CustomerStateSync.run(company, client: client) do
      {:processed, company.id}
    else
      {:error, :missing_external_id} = error ->
        {:discarded, error}

      {:error, :company_not_found} = error ->
        {:discarded, error}

      {:error, _reason} = error ->
        {:retryable_failed, error}
    end
  end

  defp process_event(%WebhookEvent{}, _client) do
    :ignored
  end

  defp finish(%WebhookEvent{} = webhook_event, {:processed, company_id}, started_at, job) do
    BillingUpdated.broadcast(company_id: company_id)

    webhook_event
    |> WebhookEvent.changeset(%{
      status: :processed,
      processed_at: DateTime.utc_now() |> DateTime.truncate(:second),
      error: nil
    })
    |> Repo.update()
    |> case do
      {:ok, _webhook_event} ->
        record_processing(:processed, webhook_event, started_at, job, %{company_id: company_id})
        :ok

      {:error, _changeset} ->
        record_processing(:internal_error, webhook_event, started_at, job, %{company_id: company_id, reason: "mark_processed_failed"})
        {:error, :internal_server_error}
    end
  end

  defp finish(%WebhookEvent{} = webhook_event, :ignored, started_at, job) do
    webhook_event
    |> WebhookEvent.changeset(%{
      status: :processed,
      processed_at: DateTime.utc_now() |> DateTime.truncate(:second),
      error: nil
    })
    |> Repo.update()
    |> case do
      {:ok, _webhook_event} ->
        record_processing(:ignored, webhook_event, started_at, job)
        :ok

      {:error, _changeset} ->
        record_processing(:internal_error, webhook_event, started_at, job, %{reason: "mark_processed_failed"})
        {:error, :internal_server_error}
    end
  end

  defp finish(%WebhookEvent{} = webhook_event, {:discarded, {:error, reason}}, started_at, job) do
    error = format_error(reason)

    webhook_event
    |> WebhookEvent.changeset(%{
      status: :failed,
      processed_at: nil,
      error: error
    })
    |> Repo.update()
    |> case do
      {:ok, _webhook_event} ->
        record_processing(:discarded, webhook_event, started_at, job, %{reason: error})
        {:discard, error}

      {:error, _changeset} ->
        record_processing(:internal_error, webhook_event, started_at, job, %{reason: "mark_failed_failed"})
        {:error, :internal_server_error}
    end
  end

  defp finish(%WebhookEvent{} = webhook_event, {:retryable_failed, {:error, reason}}, started_at, job) do
    error = format_error(reason)

    webhook_event
    |> WebhookEvent.changeset(%{
      status: :failed,
      processed_at: nil,
      error: error
    })
    |> Repo.update()
    |> case do
      {:ok, _webhook_event} ->
        record_processing(:retryable_failed, webhook_event, started_at, job, %{reason: error})
        {:error, error}

      {:error, _changeset} ->
        record_processing(:internal_error, webhook_event, started_at, job, %{reason: "mark_failed_failed"})
        {:error, :internal_server_error}
    end
  end

  defp mark_processing(%WebhookEvent{} = webhook_event) do
    webhook_event
    |> WebhookEvent.changeset(%{
      status: :processing,
      processed_at: nil,
      error: nil
    })
    |> Repo.update()
  end

  defp extract_external_id(%{"data" => %{} = data}) do
    external_id = data["external_id"] || data["externalId"]

    if is_binary(external_id) and String.trim(external_id) != "" do
      {:ok, external_id}
    else
      {:error, :missing_external_id}
    end
  end

  defp extract_external_id(_payload), do: {:error, :missing_external_id}

  defp find_company(external_id) when is_binary(external_id) do
    case Repo.get(Company, external_id) do
      %Company{} = company -> {:ok, company}
      nil -> {:error, :company_not_found}
    end
  end

  defp maybe_emit_retry(_webhook_event, nil), do: :ok

  defp maybe_emit_retry(%WebhookEvent{} = webhook_event, %{attempt: attempt} = job) when is_integer(attempt) and attempt > 1 do
    WebhookObservability.retry(%{
      provider: webhook_event.provider,
      event_type: webhook_event.event_type,
      webhook_id: webhook_event.event_id,
      billing_webhook_event_id: webhook_event.id,
      attempt: attempt,
      max_attempts: job.max_attempts,
      queue: job.queue
    })
  end

  defp maybe_emit_retry(_webhook_event, _job), do: :ok

  defp record_processing(result, %WebhookEvent{} = webhook_event, started_at, job, extra \\ %{}) do
    WebhookObservability.process(
      result,
      %{
        provider: webhook_event.provider,
        event_type: webhook_event.event_type,
        webhook_id: webhook_event.event_id,
        billing_webhook_event_id: webhook_event.id,
        attempt: job && job.attempt,
        max_attempts: job && job.max_attempts,
        queue: job && job.queue
      }
      |> Map.merge(extra),
      %{
        duration: System.monotonic_time() - started_at,
        lag_ms: lag_ms(webhook_event.received_at)
      }
    )
  end

  defp lag_ms(nil), do: 0
  defp lag_ms(%DateTime{} = received_at), do: max(DateTime.diff(DateTime.utc_now(), received_at, :millisecond), 0)

  defp format_error(reason) when is_atom(reason), do: Atom.to_string(reason)
  defp format_error(reason) when is_binary(reason), do: reason
  defp format_error(reason), do: inspect(reason)
end
