defmodule OperatelyWeb.AccountSessionController do
  use OperatelyWeb, :controller

  alias OperatelyWeb.AccountAuth

  def create(conn, params) do
    email = params["email"]
    password = params["password"]

    account_params = %{:email => email, :password => password, "remember_me" => "true"}
    account = Operately.People.get_account_by_email_and_password(email, password)

    if account do
      AccountAuth.log_in_account(conn, account, account_params)
    else
      conn |> send_resp(401, "")
    end
  end

  def delete(conn, _params) do
    conn |> AccountAuth.log_out_account()
  end

  if Application.compile_env(:operately, :test_routes) do
    def test_login(conn, params) do
      verify_application_env()

      account = Operately.People.get_account!(params["id"])

      if account do
        conn
        # make sure that redirect_to is not in the session
        |> clear_session()
        |> AccountAuth.log_in_account(account, params)
      else
        conn
        |> redirect(to: "/")
      end
    end

    defp verify_application_env() do
      if Application.get_env(:operately, :app_env) != :test do
        raise """
        You are trying to use the test_login route in a non-test environment.
        This route is only available in the test environment.
        """
      end
    end
  end
end
