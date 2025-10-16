defmodule Operately.Support.Features.UI.Debug do
  def debug(ctx, as: person) do
    verify_ui_debugging_allowed()

    url = construct_url_for_current_page(ctx, person)
    display_debugging_message(url, person)

    IO.gets("Press \e[33mEnter\e[0m to continue.")
    IO.puts("Continuing...")

    ctx
  end

  defp display_debugging_message(url, person) do
    IO.puts("")
    IO.puts("")
    IO.puts("=====================================")
    IO.puts("")
    IO.puts("UI debugger started.")
    IO.puts("You can now interact with the browser as #{person.full_name}.")
    IO.puts("Visit: \e[34m#{url}\e[0m")
    IO.puts("")
  end

  defp construct_url_for_current_page(ctx, person) do
    params = %{
      id: person.account_id,
      redirect_to: Wallaby.Browser.current_path(ctx.session)
    }

    path = "/accounts/auth/test_login?#{URI.encode_query(params)}"
    "http://localhost:4002#{path}"
  end

  # In CI, we don't want to allow UI debugging as it will block the CI pipeline.
  defp verify_ui_debugging_allowed() do
    if System.get_env("CI") == "true" do
      raise "UI debugging is not allowed in CI"
    end
  end
end
