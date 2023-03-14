defmodule OperatelyWeb.AccountResetPasswordController do
  use OperatelyWeb, :controller

  alias Operately.People

  plug :get_account_by_reset_password_token when action in [:edit, :update]

  def new(conn, _params) do
    render(conn, :new)
  end

  def create(conn, %{"account" => %{"email" => email}}) do
    if account = People.get_account_by_email(email) do
      People.deliver_account_reset_password_instructions(
        account,
        &url(~p"/accounts/reset_password/#{&1}")
      )
    end

    conn
    |> put_flash(
      :info,
      "If your email is in our system, you will receive instructions to reset your password shortly."
    )
    |> redirect(to: ~p"/")
  end

  def edit(conn, _params) do
    render(conn, :edit, changeset: People.change_account_password(conn.assigns.account))
  end

  # Do not log in the account after reset password to avoid a
  # leaked token giving the account access to the account.
  def update(conn, %{"account" => account_params}) do
    case People.reset_account_password(conn.assigns.account, account_params) do
      {:ok, _} ->
        conn
        |> put_flash(:info, "Password reset successfully.")
        |> redirect(to: ~p"/accounts/log_in")

      {:error, changeset} ->
        render(conn, :edit, changeset: changeset)
    end
  end

  defp get_account_by_reset_password_token(conn, _opts) do
    %{"token" => token} = conn.params

    if account = People.get_account_by_reset_password_token(token) do
      conn |> assign(:account, account) |> assign(:token, token)
    else
      conn
      |> put_flash(:error, "Reset password link is invalid or it has expired.")
      |> redirect(to: ~p"/")
      |> halt()
    end
  end
end
