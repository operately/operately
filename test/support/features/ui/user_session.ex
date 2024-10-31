defmodule Operately.Support.Features.UI.UserSession do
  alias Operately.Support.Features.UI

  def login_as(state, person) do
    login_as(state, person, attempts: default_login_attempts())
  end

  #
  # We had problems with the login process, more specifically with the browser
  # not being able to login the user. The actuall reason is unknown, but we
  # suspect that the browser gets stuck in a state where it can't login the user.
  #
  # To mitigate this, we retry the login process a few times before giving up.
  # This avoids unnecessary flakiness in the tests.
  #
  defp login_as(_state, person, attempts: 0) do
    raise "Failed to login as #{person.email}"
  end

  defp login_as(state, person, attempts: attempts) do
    state
    |> logout()
    |> UI.visit(login_url(person))
    |> UI.assert_has(testid: "company-home")
  rescue
    e -> 
      IO.inspect(e)
      IO.puts("\nFailed to login as #{person.email}, retrying in 1000ms...")
      :timer.sleep(1000)
      login_as(state, person, attempts: attempts - 1)
  end

  def logout(state) do
    session = state.session
    session = clear_cookie(session, "_operately_key")

    Map.put(state, :session, session)
  end

  defp clear_cookie(session, key) do
    # Before we clear the session cookie, we need to check if the cookies are empty.
    # Calling set_cookie if the cookies are empty will cause an error.
    cookies = Wallaby.Browser.cookies(session)

    if cookies != [] do
      Wallaby.Browser.set_cookie(session, key, "")
    else
      session
    end
  end

  defp login_url(person) do
    URI.encode("/accounts/auth/test_login?email=#{person.email}&full_name=#{person.full_name}")
  end

  defp default_login_attempts() do
    if System.get_env("CI") do
      10
    else
      2
    end
  end

end
