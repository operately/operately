defmodule Operately.Billing.Polar.Operations.WebhookProcessing do
  require Logger

  alias Operately.Billing.Polar.Operations.CustomerStateSync
  alias Operately.Billing.WebhookEvent
  alias Operately.Companies.Company
  alias Operately.Repo

  def run(webhook_event_id, opts \\ [])

  def run(webhook_event_id, _opts) when webhook_event_id in [nil, ""], do: :ok

  def run(webhook_event_id, opts) do
    case Repo.get(WebhookEvent, webhook_event_id) do
      nil ->
        :ok

      %WebhookEvent{status: :processed} ->
        :ok

      %WebhookEvent{} = webhook_event ->
        process(webhook_event, opts)
    end
  end

  defp process(%WebhookEvent{} = webhook_event, opts) do
    client = Keyword.get(opts, :client, Operately.Billing.Polar.Client)

    with {:ok, webhook_event} <- mark_processing(webhook_event),
         result <- process_event(webhook_event, client) do
      finish(webhook_event, result)
    end
  end

  defp process_event(%WebhookEvent{event_type: "customer.state_changed"} = webhook_event, client) do
    with {:ok, external_id} <- extract_external_id(webhook_event.payload),
         {:ok, %Company{} = company} <- find_company(external_id),
         {:ok, _account} <- CustomerStateSync.run(company, client: client) do
      {:ok, :synced}
    else
      {:error, :missing_external_id} = error ->
        error

      {:error, :company_not_found} = error ->
        error

      {:error, _reason} = error ->
        error
    end
  end

  defp process_event(%WebhookEvent{} = webhook_event, _client) do
    Logger.info("Ignoring unsupported Polar webhook event type: #{inspect(webhook_event.event_type)}")
    {:ok, :ignored}
  end

  defp finish(%WebhookEvent{} = webhook_event, {:ok, _result}) do
    webhook_event
    |> WebhookEvent.changeset(%{
      status: :processed,
      processed_at: DateTime.utc_now() |> DateTime.truncate(:second),
      error: nil
    })
    |> Repo.update()
    |> case do
      {:ok, _webhook_event} -> :ok
      {:error, _changeset} -> {:error, :internal_server_error}
    end
  end

  defp finish(%WebhookEvent{} = webhook_event, {:error, reason}) when reason in [:missing_external_id, :company_not_found] do
    error = format_error(reason)

    webhook_event
    |> WebhookEvent.changeset(%{
      status: :failed,
      processed_at: nil,
      error: error
    })
    |> Repo.update()
    |> case do
      {:ok, _webhook_event} -> {:discard, error}
      {:error, _changeset} -> {:error, :internal_server_error}
    end
  end

  defp finish(%WebhookEvent{} = webhook_event, {:error, reason}) do
    error = format_error(reason)

    webhook_event
    |> WebhookEvent.changeset(%{
      status: :failed,
      processed_at: nil,
      error: error
    })
    |> Repo.update()
    |> case do
      {:ok, _webhook_event} -> {:error, error}
      {:error, _changeset} -> {:error, :internal_server_error}
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

  defp format_error(reason) when is_atom(reason), do: Atom.to_string(reason)
  defp format_error(reason) when is_binary(reason), do: reason
  defp format_error(reason), do: inspect(reason)
end
