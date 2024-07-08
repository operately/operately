defmodule OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, opts) do
    except = opts[:except] || []

    action = conn.assigns.turbo_req_name
    type = conn.assigns.turbo_req_type
    tuple = {type, action}

    cond do
      tuple in except -> 
        # skipping authentication as requested
        conn

      conn.assigns[:current_account] == nil ->
        conn
        |> send_resp(401, "Unauthorized")
        |> halt()

      true ->
        conn
    end
  end
end
