defmodule OperatelyEE.AdminAPI.Plugs.RequireSiteAdmin do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    account = conn.assigns[:current_account]

    cond do
      account && account.site_admin == true ->
        conn

      true ->
        conn |> send_resp(401, "Unauthorized") |> halt()
    end
  end
end
