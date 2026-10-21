defmodule OperatelyWeb.Api.Plugs.RequireCompanyContext do
  @moduledoc "Requires resolved company membership after account authentication."

  use Gettext, backend: OperatelyWeb.Gettext
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, opts) do
    endpoint = {conn.assigns.turbo_req_type, conn.assigns.turbo_req_name}

    cond do
      endpoint in Keyword.get(opts, :except, []) ->
        conn

      is_nil(conn.assigns[:current_company]) ->
        reject(conn, 400, %{
          error: "Bad request",
          code: "missing_company_context",
          message: gettext("The request was malformed")
        })

      is_nil(conn.assigns[:current_person]) ->
        reject(conn, 404, %{error: "Not found", message: gettext("The requested resource was not found")})

      true ->
        conn
    end
  end

  defp reject(conn, status, body) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, Jason.encode!(body))
    |> halt()
  end
end
