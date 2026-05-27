defmodule OperatelyWeb.PolarWebhookController do
  use OperatelyWeb, :controller

  require Logger

  alias Operately.Billing
  alias Operately.Billing.Polar.WebhookObservability
  alias Operately.Billing.Polar.WebhookVerifier

  def create(conn, _params) do
    context = ingress_context(conn)

    with :ok <- verify_json_request(conn),
         {:ok, raw_body} <- fetch_raw_body(conn),
         {:ok, headers} <- fetch_signature_headers(conn),
         :ok <- verify_signature(raw_body, headers),
         {:ok, ingest_result} <- Billing.ingest_polar_webhook(conn.body_params, headers) do
      WebhookObservability.ingest(ingest_result.result, Map.merge(context, Map.delete(ingest_result, :result)))
      send_resp(conn, :accepted, "")
    else
      {:error, :internal_server_error} ->
        WebhookObservability.ingest(:internal_error, context)
        send_resp(conn, :internal_server_error, "")

      {:error, :missing_secret} ->
        WebhookObservability.ingest(:missing_secret, context)
        send_resp(conn, :service_unavailable, "")

      {:error, :invalid_payload} ->
        WebhookObservability.ingest(:invalid_payload, context)
        send_resp(conn, :bad_request, "")

      {:error, :invalid_json} ->
        WebhookObservability.ingest(:invalid_json, context)
        send_resp(conn, :bad_request, "")

      {:error, reason} ->
        WebhookObservability.ingest(:invalid_signature, Map.put(context, :reason, reason))
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

  defp ingress_context(conn) do
    %{
      provider: "polar",
      request_id: Logger.metadata()[:request_id],
      webhook_id: List.first(get_req_header(conn, "webhook-id"))
    }
  end
end
