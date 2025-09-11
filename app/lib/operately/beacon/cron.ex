defmodule Operately.Beacon.Cron do
  use Oban.Worker, queue: :default

  require Logger

  @beacon_url "http://app.operately.com/analytics/beacons"

  @impl Oban.Worker
  def perform(_) do
    if Application.get_env(:operately, :beacon_enabled, false) do
      send_beacon()
    else
      :ok
    end
  end

  def send_beacon do
    catch_and_log_errors(fn ->
      beacon_data = collect_beacon_data()
      send_to_beacon_service(beacon_data)
    end)
  end

  defp collect_beacon_data do
    %{
      version: Operately.version(),
      installation_id: Operately.installation_id()
    }
  end

  defp send_to_beacon_service(data) do
    headers = [{"content-type", "application/json"}]
    body = Jason.encode!(data)
    req = Finch.build(:post, @beacon_url, headers, body)

    case Finch.request(req, Operately.Finch, receive_timeout: 5_000) do
      {:ok, %Finch.Response{status: status}} when status in 200..299 -> :ok
      _ -> :error
    end
  end

  defp catch_and_log_errors(cb) do
    try do
      cb.()
    rescue
      e -> Logger.error("Error in Operately.Beacon.Cron: #{inspect(e)}")
    end
  end
end
