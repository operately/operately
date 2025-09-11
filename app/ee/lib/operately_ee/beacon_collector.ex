defmodule OperatelyEE.BeaconCollector do
  @behaviour Plug
  require Logger

  @posthog_api_url "https://us.i.posthog.com/i/v0/e/"

  def init(opts), do: opts

  def call(conn, _opts) do
    if beacon_collector_enabled?() do
      collect_beacon(conn)
      send_200(conn)
    else
      send_404(conn)
    end
  end

  defp collect_beacon(conn) do
    data = conn.body_params
    posthog_event = transform_to_posthog_event(data)

    case send_to_posthog(posthog_event) do
      {:ok, response} -> {:ok, response}
      {:error, reason} -> {:error, {:posthog_error, reason}}
    end

    conn
  end

  defp transform_to_posthog_event(data) do
    %{
      api_key: Application.get_env(:operately, :posthog_api_key),
      event: "self_hosted_beacon",
      distinct_id: data["installation_id"],
      properties: %{
        operately_version: data["version"],
      },
    }
  end

  defp send_to_posthog(event_data) do
    headers = [{"content-type", "application/json"}]

    body = Jason.encode!(event_data)
    req = Finch.build(:post, @posthog_api_url, headers, body)

    case Finch.request(req, Operately.Finch, receive_timeout: 10_000) do
      {:ok, %Finch.Response{status: status}} when status in 200..299 ->
        {:ok, :sent}

      {:ok, %Finch.Response{status: status, body: response_body}} ->
        {:error, {:http_error, status, response_body}}

      {:error, reason} ->
        {:error, {:request_failed, reason}}
    end
  end

  defp beacon_collector_enabled? do
    Application.get_env(:operately, :beacon_collector_enabled, false)
  end

  defp send_200(conn) do
    conn |> Plug.Conn.send_resp(200, "OK") |> Plug.Conn.halt()
  end

  defp send_404(conn) do
    conn |> Plug.Conn.send_resp(404, "Not Found") |> Plug.Conn.halt()
  end
end
