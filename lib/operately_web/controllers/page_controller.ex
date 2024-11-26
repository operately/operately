defmodule OperatelyWeb.PageController do
  use OperatelyWeb, :controller

  def index(conn, _params) do
    if configured?() do
      handle_operately_is_configured(conn)
    else
      handle_operately_is_not_configured(conn)
    end
  end

  defp handle_operately_is_configured(conn) do
    cond do
      conn.request_path == "/setup" -> redirect_to_homepage(conn)
      true -> render(conn, :page)
    end
  end

  defp handle_operately_is_not_configured(conn) do
    if conn.request_path == "/setup" do
      render(conn, :page)
    else
      conn |> redirect(to: "/setup") |> halt()
    end
  end

  #
  # If the companies count is 0, it means that the user
  # hasn't gone through the first-time setup and the account
  # is not configured yet.
  #
  defp configured?() do
    Operately.Companies.count_companies() > 0
  end

  defp redirect_to_homepage(conn) do
    if conn.assigns[:current_account] do
      account = conn.assigns[:current_account]
      path = OperatelyWeb.AccountAuth.after_login_path(account)
      conn |> redirect(to: path) |> halt()
    else
      conn |> redirect(to: "/") |> halt()
    end
  end
end
