defmodule OperatelyWeb.CliLoginController do
  use OperatelyWeb, :controller

  alias Operately.People.CliAuthSession
  alias OperatelyWeb.Paths

  @cli_auth_session_key :oauth_cli_auth_session_id

  def show(conn, %{"id" => id} = params) do
    case CliAuthSession.get_by_id(id) do
      nil ->
        send_not_found(conn)

      session ->
        if session.status == :pending and not CliAuthSession.expired?(session) do
          redirect_to = Paths.cli_login_success_path(session.id)

          auth_url = build_google_auth_url(session.id, redirect_to, params)

          conn
          |> put_session(@cli_auth_session_key, session.id)
          |> redirect(to: auth_url)
        else
          redirect(conn, to: Paths.cli_login_success_path(session.id))
        end
    end
  end

  defp build_google_auth_url(session_id, redirect_to, params) do
    query =
      [
        {"redirect_to", redirect_to},
        {"invite_token", params["invite_token"]}
      ]
      |> maybe_add_test_google_params(session_id, params)
      |> Enum.reject(fn {_key, value} -> is_nil(value) or value == "" end)
      |> URI.encode_query()

    "#{auth_route(params)}?#{query}"
  end

  def success(conn, %{"id" => id}) do
    case CliAuthSession.get_by_id(id) do
      nil ->
        send_not_found(conn)

      session ->
        conn
        |> put_resp_content_type("text/html")
        |> send_resp(200, html_page(title(session), body(session)))
    end
  end

  defp title(session) do
    cond do
      CliAuthSession.expired?(session) -> "Authentication Expired"
      session.status == :pending -> "Authentication In Progress"
      CliAuthSession.no_companies?(session) -> "No Companies Found"
      session.status == :failed -> "Authentication Failed"
      true -> "Authentication Complete"
    end
  end

  defp body(session) do
    cond do
      CliAuthSession.expired?(session) -> "This authentication session has expired. Please return to the CLI and try again."
      session.status == :pending -> "Authentication is still in progress. Please complete the authentication in your browser."
      CliAuthSession.no_companies?(session) -> "Your account is not associated with any companies. Please contact your administrator."
      session.status == :failed -> CliAuthSession.failure_message(session)
      true -> "Authentication complete. Return to the CLI to finish the setup."
    end
  end

  defp html_page(title, body) do
    """
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>#{title} — Operately</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f8f8f8;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          .card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
            padding: 48px;
            max-width: 420px;
            width: 90%;
            text-align: center;
          }
          .logo {
            width: 48px;
            height: 48px;
            margin: 0 auto 24px;
          }
          h1 {
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0 0 12px;
            line-height: 1.3;
          }
          p {
            font-size: 14px;
            color: #666666;
            margin: 0;
            line-height: 1.5;
          }
          @media (max-width: 480px) {
            .card { padding: 32px 24px; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="193.04 193.04 613.92 613.92">
            <polygon points="602.32 806.96 397.68 806.96 397.68 602.32 602.32 806.96" fill="#024fac"/>
            <polygon points="397.68 193.04 602.32 193.04 602.32 397.68 397.68 193.04" fill="#024fac"/>
            <polygon points="602.32 193.04 602.32 397.68 602.32 602.32 602.32 806.96 806.96 602.32 806.96 397.68 602.32 193.04" fill="#3185ff"/>
            <polygon points="193.04 397.68 193.04 602.32 397.68 806.96 397.68 602.32 397.68 397.68 397.68 193.04 193.04 397.68" fill="#3185ff"/>
          </svg>
          <h1>#{title}</h1>
          <p>#{body}</p>
        </div>
      </body>
    </html>
    """
  end

  defp send_not_found(conn) do
    conn
    |> send_resp(404, "Not Found")
  end

  if Application.compile_env(:operately, :test_routes) do
    defp maybe_add_test_google_params(query, session_id, params) do
      if use_test_google_route?(params) do
        # The E2E "browser" is stateless, so pass the CLI auth session id explicitly.
        query ++
          [
            {"account_id", params["account_id"]},
            {"email", params["email"]},
            {"name", params["name"]},
            {"image", params["image"]},
            {"cli_auth_session_id", session_id}
          ]
      else
        query
      end
    end

    defp auth_route(params) do
      if use_test_google_route?(params), do: "/accounts/auth/test_google", else: "/accounts/auth/google"
    end

    defp use_test_google_route?(params) do
      present?(params["account_id"]) or present?(params["email"])
    end

    defp present?(nil), do: false
    defp present?(""), do: false
    defp present?(_), do: true
  else
    defp maybe_add_test_google_params(query, _session_id, _params), do: query
    defp auth_route(_params), do: "/accounts/auth/google"
  end
end
