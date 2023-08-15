defmodule Operately.FeatureCase do
  @moduledoc """
  This module defines the test case to be used by
  features inside of test/features.

  Such tests rely on the database being reset between
  each test. This is done by using the `async: false`
  option in the `use Cabbage.Feature` macro.
  """

  defmacro __using__(_opts) do
    quote do
      alias Operately.Repo
      alias Operately.FeatureCase.UI

      use Operately.DataCase, async: false
      use Wallaby.Feature, async: false

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

    def get_account() do
      Operately.People.Account
      |> Operately.Repo.get_by(email: "john@johnson.com")
      |> Operately.Repo.preload(:person)
    end

    def click(state, opts) do
      {session, opts} = Keyword.pop(opts, :in)
      context = session || session(state)
      css_query = compose_css_query(opts)

      context |> Browser.click(Query.css(css_query))

      state
    end

    def assert_has(state, opts) do
      {session, opts} = Keyword.pop(opts, :in)
      context = session || session(state)
      css_query = compose_css_query(opts)

      context |> Browser.assert_has(Query.css(css_query))

      state
    end

    def click_button(state, text) do
      session(state) |> Browser.click(Query.button(text))
    end

    def click_link(state, text) do
      session(state) |> Browser.click(Query.link(text))
    end

    def fill(state, label, with: value) when is_binary(label) do
      session(state)
      |> Browser.fill_in(Query.text_field(label), with: value)
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
      |> Browser.find(Query.css(".ProseMirror[contenteditable=true]"), fn element ->
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

    def assert_page(state, path) do
      require ExUnit.Assertions

      wait_for_page_to_load(state, path)

      ExUnit.Assertions.assert Browser.current_path(session(state)) == path

      state
    end

    def visit(state, path) do
      session(state) |> Browser.visit(path)
    end

    def find(state, testid: id) do
      session(state) |> Browser.find(Query.css("[data-test-id=\"#{id}\"]"))
    end

    def wait_for_page_to_load(state, path) do
      s = session(state)

      Wallaby.Browser.retry(fn ->
        if Wallaby.Browser.current_path(s) == path do
          {:ok, s}
        else
          {:error, :not_yet}
        end
      end)

      state
    end

    #
    # Handle the case when the session is a feature
    # case session or a wallaby session
    #
    defp session(%{session: session}), do: session
    defp session(session), do: session

    defp compose_css_query([]), do: ""

    defp compose_css_query([p | rest]) do
      case p do
        {:title, title} -> "[title=\"#{title}\"]" <> compose_css_query(rest)
        {:alt, alt} -> "[alt=\"#{alt}\"]" <> compose_css_query(rest)
        {:testid, id} -> "[data-test-id=\"#{id}\"]" <> compose_css_query(rest)
        _ -> raise "Unknown pattern #{inspect(p)}"
      end
    end
  end
end
