defmodule OperatelyWeb.PageController do
  use OperatelyWeb, :controller

  @public_pages [
    "/accounts/log_in",
    "/join",
  ]

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
      conn.request_path in @public_pages -> public_page(conn)
      true -> private_page(conn)
    end
  end

  defp handle_operately_is_not_configured(conn) do
    if conn.request_path == "/setup" do
      render(conn, :home)
    else
      conn |> redirect(to: ~p"/setup") |> halt()
    end
  end

  defp public_page(conn) do
    render(conn, :home)
  end

  #
  # If the page is not public, we check whether the request
  # is authenticated. The :fetch_current_account in the router
  # is responsible for fetching the current account and
  # assigning it to the conn. This function redirects the
  # user to the login page if the current account is not assigned
  # to the conn.
  #
  defp private_page(conn) do
    if conn.assigns[:current_account] do
      render(conn, :home)
    else
      conn
      |> put_session(:redirect_to, conn.request_path)
      |> redirect(to: ~p"/accounts/log_in")
      |> halt()
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
