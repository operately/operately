defmodule Operately.Beacon.Cron do
  use Oban.Worker, queue: :default

  require Logger

  @beacon_url "http://beacons.operately.com"

  @impl Oban.Worker
  def perform(_) do
    if beacon_enabled?() do
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
      version: get_version(),
      operating_system: get_operating_system(),
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
    }
  end

  defp get_version do
    Application.spec(:operately, :vsn) |> to_string()
  end

  defp get_operating_system do
    case :os.type() do
      {:unix, :linux} -> "linux"
      {:unix, :darwin} -> "macos"
      {:unix, :freebsd} -> "freebsd"
      {:win32, _} -> "windows"
      {family, name} -> "#{family}_#{name}"
    end
  end

  defp send_to_beacon_service(data) do
    headers = [{"content-type", "application/json"}]
    body = Jason.encode!(data)

    case Finch.build(:post, @beacon_url, headers, body)
         |> Finch.request(Operately.Finch, receive_timeout: 5_000) do
      {:ok, %Finch.Response{status: status}} when status in 200..299 ->
        Logger.debug("Beacon sent successfully: #{inspect(data)}")
        :ok

      {:ok, %Finch.Response{status: status}} ->
        Logger.warning("Beacon service returned non-success status: #{status}")
        :error

      {:error, reason} ->
        Logger.warning("Failed to send beacon: #{inspect(reason)}")
        :error
    end
  end

  defp beacon_enabled? do
    # Check application config first, then fall back to environment variable
    case Application.get_env(:operately, :beacon_enabled, true) do
      false -> false
      _ -> 
        case System.get_env("OPERATELY_BEACON_ENABLED", "true") do
          "false" -> false
          "no" -> false
          "0" -> false
          _ -> true
        end
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