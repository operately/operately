defmodule Operately.FeatureCase do
  @moduledoc """
  This module defines the test case to be used by
  features inside of test/features.

  Such tests rely on the database being reset between
  each test. This is done by using the `async: false`
  option in the `use Cabbage.Feature` macro.
  """

  defmacro __using__([file: file]) do
    quote do
      alias Operately.Repo

      import Operately.DataCase

      use Cabbage.Feature, async: false, file: unquote(file)
      use Wallaby.Feature

      setup data do
        Operately.DataCase.setup_sandbox(async: false)

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

      defp ts(session) do
        take_screenshot(session)
      end

      def scroll_into_view(session, css_selector) do
        session |> execute_script("document.querySelector('#{css_selector}').scrollIntoView()")
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
end
