defmodule OperatelyWeb.PolarWebhookController do
  use OperatelyWeb, :controller

  require Logger

  alias Operately.Billing
  alias Operately.Billing.Polar.WebhookVerifier

  def create(conn, _params) do
    with :ok <- verify_json_request(conn),
         {:ok, raw_body} <- fetch_raw_body(conn),
         {:ok, headers} <- fetch_signature_headers(conn),
         :ok <- verify_signature(raw_body, headers),
         :ok <- Billing.ingest_polar_webhook(conn.body_params, headers) do
      send_resp(conn, :accepted, "")
    else
      {:error, :internal_server_error} -> send_resp(conn, :internal_server_error, "")
      {:error, :missing_secret} -> send_resp(conn, :service_unavailable, "")
      {:error, :invalid_payload} -> send_resp(conn, :bad_request, "")
      {:error, :invalid_json} -> send_resp(conn, :bad_request, "")
      {:error, reason} ->
        Logger.warning("Polar webhook rejected: #{inspect(reason)}")
        send_resp(conn, :forbidden, "")
    end
  end

  defp verify_json_request(conn) do
    content_type = List.first(get_req_header(conn, "content-type")) || ""

    if String.starts_with?(content_type, "application/json") do
      :ok
    else
      {:error, :invalid_json}
    end
  end

  defp fetch_raw_body(conn) do
    case conn.private[:raw_body] do
      # This raw body was captured by the parser step. Polar signs it directly instead of a parsed params map.
      raw_body when is_binary(raw_body) -> {:ok, raw_body}
      _ -> {:error, :invalid_json}
    end
  end

  defp fetch_signature_headers(conn) do
    headers =
      ["webhook-id", "webhook-timestamp", "webhook-signature"]
      |> Enum.reduce(%{}, fn header_name, acc ->
        case get_req_header(conn, header_name) do
          [value | _] -> Map.put(acc, header_name, value)
          _ -> acc
        end
      end)

    if map_size(headers) == 3 do
      {:ok, headers}
    else
      {:error, :invalid_signature}
    end
  end

  defp verify_signature(raw_body, headers) do
    WebhookVerifier.verify(raw_body, headers)
  end
end
