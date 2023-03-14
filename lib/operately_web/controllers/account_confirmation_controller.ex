defmodule OperatelyWeb.AccountConfirmationController do
  use OperatelyWeb, :controller

  alias Operately.People

  def new(conn, _params) do
    render(conn, :new)
  end

  def create(conn, %{"account" => %{"email" => email}}) do
    if account = People.get_account_by_email(email) do
      People.deliver_account_confirmation_instructions(
        account,
        &url(~p"/accounts/confirm/#{&1}")
      )
    end

    conn
    |> put_flash(
      :info,
      "If your email is in our system and it has not been confirmed yet, " <>
        "you will receive an email with instructions shortly."
    )
    |> redirect(to: ~p"/")
  end

  def edit(conn, %{"token" => token}) do
    render(conn, :edit, token: token)
  end

  # Do not log in the account after confirmation to avoid a
  # leaked token giving the account access to the account.
  def update(conn, %{"token" => token}) do
    case People.confirm_account(token) do
      {:ok, _} ->
        conn
        |> put_flash(:info, "Account confirmed successfully.")
        |> redirect(to: ~p"/")

      :error ->
        # If there is a current account and the account was already confirmed,
        # then odds are that the confirmation link was already visited, either
        # by some automation or by the account themselves, so we redirect without
        # a warning message.
        case conn.assigns do
          %{current_account: %{confirmed_at: confirmed_at}} when not is_nil(confirmed_at) ->
            redirect(conn, to: ~p"/")

          %{} ->
            conn
            |> put_flash(:error, "Account confirmation link is invalid or it has expired.")
            |> redirect(to: ~p"/")
        end
    end
  end
end
