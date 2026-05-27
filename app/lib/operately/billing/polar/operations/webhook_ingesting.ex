defmodule Operately.Billing.Polar.Operations.WebhookIngesting do
  alias Ecto.Multi
  alias Operately.Billing.WebhookEvent
  alias Operately.Billing.Polar.ProcessWebhookWorker
  alias Operately.Repo

  def run(payload, headers) when is_map(payload) and is_map(headers) do
    with {:ok, attrs} <- build_attrs(payload, headers) do
      Multi.new()
      |> Multi.insert(:webhook_event, WebhookEvent.changeset(attrs))
      |> Oban.insert(:process_webhook, fn %{webhook_event: webhook_event} ->
        ProcessWebhookWorker.new(%{billing_webhook_event_id: webhook_event.id})
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{webhook_event: webhook_event}} ->
          {:ok,
           %{
             result: :accepted,
             provider: attrs.provider,
             event_type: attrs.event_type,
             webhook_id: attrs.event_id,
             billing_webhook_event_id: webhook_event.id
           }}

        {:error, :webhook_event, changeset, _changes} ->
          if duplicate_event?(changeset) do
            {:ok,
             %{
               result: :duplicate,
               provider: attrs.provider,
               event_type: attrs.event_type,
               webhook_id: attrs.event_id
             }}
          else
            {:error, :invalid_payload}
          end

        {:error, :process_webhook, _changeset, _changes} ->
          {:error, :internal_server_error}
      end
    end
  end

  def run(_, _), do: {:error, :invalid_payload}

  defp build_attrs(payload, headers) do
    case payload["type"] || payload[:type] do
      event_type when is_binary(event_type) and event_type != "" ->
        {:ok,
         %{
           provider: "polar",
           event_id: headers["webhook-id"],
           event_type: event_type,
           payload: payload,
           received_at: DateTime.utc_now() |> DateTime.truncate(:second),
           status: :pending
         }}

      _ ->
        {:error, :invalid_payload}
    end
  end

  defp duplicate_event?(changeset) do
    Enum.any?(changeset.errors, fn
      {:event_id, {_message, opts}} -> opts[:constraint] == :unique
      _ -> false
    end)
  end
end
