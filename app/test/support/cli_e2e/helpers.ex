defmodule Operately.Support.CliE2E.Helpers do
  import Ecto.Query
  import ExUnit.Assertions

  import Operately.CliE2ECase

  alias Operately.People.CliAuthSession
  alias Operately.Repo
  alias Operately.Support.Features.UI.Emails

  @activation_email_subject_prefix "Operately confirmation code: "

  def enable_auth_methods do
    previous_allow_login_with_email = Application.get_env(:operately, :allow_login_with_email)
    previous_allow_login_with_google = Application.get_env(:operately, :allow_login_with_google)
    previous_allow_signup_with_email = Application.get_env(:operately, :allow_signup_with_email)

    Application.put_env(:operately, :allow_login_with_email, true)
    Application.put_env(:operately, :allow_login_with_google, true)
    Application.put_env(:operately, :allow_signup_with_email, true)

    %{
      allow_login_with_email: previous_allow_login_with_email,
      allow_login_with_google: previous_allow_login_with_google,
      allow_signup_with_email: previous_allow_signup_with_email
    }
  end

  def restore_auth_methods(previous) do
    Application.put_env(:operately, :allow_login_with_email, previous.allow_login_with_email)
    Application.put_env(:operately, :allow_login_with_google, previous.allow_login_with_google)
    Application.put_env(:operately, :allow_signup_with_email, previous.allow_signup_with_email)
  end

  def wait_for_google_session!(timeout_ms \\ 5_000) do
    deadline = System.monotonic_time(:millisecond) + timeout_ms
    do_wait_for_google_session(deadline)
  end

  def activation_code_response(email) do
    fn -> wait_for_activation_code!(email) <> "\n" end
  end

  def wait_for_activation_code!(email, attempts \\ 10) do
    do_wait_for_activation_code(email, attempts)
  end

  def complete_mock_google_auth!(ctx, session, params, expected_status \\ :authenticated) do
    login_response = browser_get(ctx, "/cli-login/#{session.id}?#{encode_query(params)}")

    assert login_response.status == 302
    assert login_response.headers["location"] =~ "/accounts/auth/test_google"

    auth_response = browser_get(ctx, login_response.headers["location"])

    assert auth_response.status == 302
    assert auth_response.headers["location"] == "/cli-login/#{session.id}/success"

    session = Repo.get!(CliAuthSession, session.id)
    assert session.status == expected_status

    ctx
  end

  defp do_wait_for_google_session(deadline) do
    session =
      from(s in CliAuthSession,
        where: s.auth_method == :google,
        order_by: [desc: s.inserted_at],
        limit: 1
      )
      |> Repo.one()

    cond do
      session && session.status == :pending ->
        session

      System.monotonic_time(:millisecond) >= deadline ->
        flunk("Timed out waiting for the CLI to create a pending Google auth session")

      true ->
        Process.sleep(100)
        do_wait_for_google_session(deadline)
    end
  end

  defp do_wait_for_activation_code(email, attempts) do
    emails = Emails.wait_for_email_for(email, attempts: attempts)

    case Enum.filter(emails, &String.starts_with?(&1.subject, @activation_email_subject_prefix)) do
      [] when attempts > 0 ->
        Process.sleep(1_000)
        do_wait_for_activation_code(email, attempts - 1)

      [] ->
        flunk("Timed out waiting for an activation code email for #{email}")

      matches ->
        parse_activation_code!(List.last(matches))
    end
  end

  defp parse_activation_code!(email) do
    case String.split(email.subject, @activation_email_subject_prefix, parts: 2) do
      ["", code] when code != "" -> code
      _ -> flunk("Failed to extract activation code from email subject: #{inspect(email.subject)}")
    end
  end

  defp encode_query(params) do
    params
    |> Enum.map(fn {key, value} -> {to_string(key), value} end)
    |> URI.encode_query()
  end
end
