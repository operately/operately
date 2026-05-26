defmodule OperatelyWeb.PolarWebhookController do
  use OperatelyWeb, :controller

  alias Operately.Billing.Polar.WebhookVerifier

  def create(conn, _params) do
    with :ok <- verify_json_request(conn),
         {:ok, raw_body} <- fetch_raw_body(conn),
         :ok <- verify_signature(conn, raw_body) do
      send_resp(conn, :accepted, "")
    else
      {:error, :missing_secret} -> send_resp(conn, :service_unavailable, "")
      {:error, :invalid_json} -> send_resp(conn, :bad_request, "")
      {:error, :invalid_signature} -> send_resp(conn, :forbidden, "")
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

  defp verify_signature(conn, raw_body) do
    headers =
      ["webhook-id", "webhook-timestamp", "webhook-signature"]
      |> Enum.reduce(%{}, fn header_name, acc ->
        case get_req_header(conn, header_name) do
          [value | _] -> Map.put(acc, header_name, value)
          _ -> acc
        end
      end)

    WebhookVerifier.verify(raw_body, headers)
  end
end
