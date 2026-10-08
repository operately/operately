defmodule Operately.Analytics.Delivery do
  use Oban.Worker, queue: :analytics, max_attempts: 10
  require Logger
  alias Operately.Analytics

  @impl true
  def perform(%Oban.Job{args: %{"event" => event}} = job) do
    properties = event["properties"]

    allowed =
      Analytics.enabled?() and not Analytics.opted_out?(event["distinct_id"]) and
        not Analytics.opted_out?(properties["creator_account_id"])

    if allowed do
      result = deliver(event)

      if match?({:cancel, _}, result) or (match?({:error, _}, result) and job.attempt >= job.max_attempts) do
        Logger.error("Conversion analytics delivery failed", event_id: event["uuid"], event_name: event["event"])
      end

      result
    else
      :ok
    end
  end

  defp deliver(event) do
    config = Analytics.config()
    body = Jason.encode!(Map.put(event, "api_key", config[:token]))
    request = Finch.build(:post, String.trim_trailing(config[:host], "/") <> "/capture/", [{"content-type", "application/json"}], body)

    case Finch.request(request, Operately.Finch, receive_timeout: 5_000) do
      {:ok, %{status: status}} when status in 200..299 -> :ok
      {:ok, %{status: status}} when status == 429 or status >= 500 -> {:error, {:http, status}}
      {:ok, %{status: status}} -> {:cancel, {:http, status}}
      {:error, _} -> {:error, :transport_error}
    end
  end
end
