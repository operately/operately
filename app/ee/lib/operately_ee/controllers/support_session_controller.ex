defmodule OperatelyEE.Controllers.SupportSessionController do
  use OperatelyWeb, :controller

  require Logger

  plug :fetch_current_account
  plug :verify_account_is_site_admin

  def start(conn, %{"company_id" => company_id}) do
    with(
      {:ok, company} <- load_company(company_id),
      {:ok, encrypted_token} <- create_support_session_token(conn.assigns.current_account, company)
    ) do
      Logger.info("Support session started by admin #{conn.assigns.current_account.id} for company #{company.id}")

      conn
      |> put_resp_cookie("support_session_token", encrypted_token, cookie_options())
      |> json(%{success: true, redirect_url: OperatelyWeb.Paths.home_path(company)})
    else
      {:error, :forbidden} ->
        conn |> put_status(:forbidden) |> json(%{error: "Admin access required"})
      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "Company not found"})
      {:error, :no_owners} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: "Company has no owners to impersonate"})
      {:error, _} ->
        conn |> put_status(:internal_server_error) |> json(%{error: "Internal error"})
    end
  end

  def end_session(conn, _params) do
    Logger.info("Support session ended by admin #{conn.assigns.current_account.id}")

    conn
    |> delete_resp_cookie("support_session_token")
    |> json(%{success: true, redirect_url: "/admin"})
  end

  #
  # Helpers
  #

  defp fetch_current_account(conn, _opts) do
    case conn.assigns[:current_account] do
      nil -> conn |> put_status(:unauthorized) |> json(%{error: "Authentication required"}) |> halt()
      account -> assign(conn, :current_account, account)
    end
  end

  defp verify_account_is_site_admin(conn, _opts) do
    if Operately.People.Account.is_site_admin?(conn.assigns.current_account) do
      conn
    else
      conn |> put_status(:forbidden) |> json(%{error: "Admin access required"}) |> halt()
    end
  end

  defp load_company(company_id) do
    case OperatelyWeb.Api.Helpers.decode_company_id(company_id) do
      {:ok, id} ->
        case Operately.Companies.get_company!(id) do
          nil -> {:error, :not_found}
          company -> {:ok, company}
        end
      {:error, _} -> {:error, :invalid_company_id}
    end
  end

  defp create_support_session_token(admin_account, company) do
    OperatelyEE.SupportSession.create_support_session_token(admin_account, company)
  end

  defp cookie_options do
    [
      max_age: 3600,        # 1 hour
      http_only: true,      # Prevent JavaScript access
      secure: true,         # HTTPS only in production
      same_site: "Lax"      # CSRF protection
    ]
  end
end
