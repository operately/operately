defmodule Operately.FeatureCase do
  @moduledoc """
  This module defines the test case to be used by
  features inside of test/features.

  Such tests rely on the database being reset between
  each test. This is done by using the `async: false`
  option in the `use Cabbage.Feature` macro.
  """

  defmacro __using__(opts) do
    quote do
      alias Operately.Repo
      alias Operately.FeatureCase.UI

      use Operately.DataCase, async: false
      use Wallaby.Feature

      setup data do
        Wallaby.Browser.resize_window(data.session, 1920, 1080)

        :ok
      end

      defp select(session, option_name, from: select_name) do
        alias Wallaby.Query

        session
        |> find(Query.select(select_name), fn select ->
          click(select, Query.option(option_name))
        end)
      end

      def scroll_into_view(session, css_selector) do
        session |> Wallaby.Browser.execute_script("document.querySelector('#{css_selector}').scrollIntoView()")
      end

      def wait_for_page_to_load(session, path) do
        Wallaby.Browser.retry(fn ->
          if Wallaby.Browser.current_path(session) == path do
            {:ok, session}
          else
            {:error, :not_yet}
          end
        end)
      end
    end
  end

  defmodule UI do
    alias Wallaby.Query

    import Wallaby.Browser
    alias Wallaby.Browser

    def login(session) do
      path = URI.encode("/accounts/auth/test_login?email=john@johnson.com")

      session(session) |> Browser.visit(path)
    end

    def click(state, testid: test_id) do
      session(state)
      |> Browser.click(Query.css("[data-test-id=\"#{test_id}\"]"))
    end

    def click(state, alt: alt) do
      session(state)
      |> Browser.click(Query.css("[alt=\"#{alt}\"]"))
    end

    def click_button(state, text) do
      session(state) |> Browser.click(Query.button(text))
    end

    def fill(state, placeholder: placeholder, with: value) do
      session(state)
      |> Browser.fill_in(Query.css("[placeholder=\"#{placeholder}\"]"), with: value)
    end

    def fill(state, testid: id, with: value) do
      session(state)
      |> Browser.fill_in(Query.css("[data-test-id=\"#{id}\"]"), with: value)
    end

    def fill_rich_text(state, message) do
      session(state)
      |> Browser.find(Query.css(".ProseMirror"), fn element ->
        element |> Browser.send_keys(message)
      end)
    end

    def send_keys(state, keys) do
      session(state)
      |> Browser.send_keys(keys)
    end

    def assert_text(state, text) do
      session(state)
      |> Browser.assert_text(text)
    end

    def assert_text(state, text, testid: id) do
      session(state)
      |> Browser.find(Query.css("[data-test-id=\"#{id}\"]"), fn element ->
        element |> Browser.assert_text(text)
      end)
    end

    def assert_has(state, alt: alt) do
      session(state) |> Browser.assert_has(Query.css("[alt=\"#{alt}\"]"))
    end

    def visit(state, path) do
      session(state) |> Browser.visit(path)
    end

    #
    # Handle the case when the session is a feature
    # case session or a wallaby session
    #
    defp session(%{session: session}), do: session
    defp session(session), do: session
  end
end
