defmodule Operately.FeatureCase do
  use ExUnit.CaseTemplate

  defmacro __using__(_) do
    quote do
      use ExUnit.Case, async: false
      use Wallaby.Feature
      use Bamboo.Test, shared: true

      import Operately.FeatureSteps

      alias Operately.Repo
      alias Operately.Support.Features.UI
      alias OperatelyWeb.Paths

      import Wallaby.Browser, except: [assert_text: 2, click: 2, fill: 2, find: 2, visit: 1]

      setup data do
        Wallaby.Browser.resize_window(data.session, 1920, 2000)

        screenshots_before = Path.wildcard("/tmp/screenshots/*")

        on_exit fn ->
          screenshots_after = Path.wildcard("/tmp/screenshots/*")

          list_screenshots(screenshots_before, screenshots_after)
        end

        :ok
      end

      defp list_screenshots(screenshots_before, screenshots_after) do
        diff = screenshots_after -- screenshots_before
        sorted_by_time = Enum.sort(diff, fn a, b -> File.stat!(a).mtime > File.stat!(b).mtime end)

        if sorted_by_time != [] do
          IO.puts("")
          IO.puts("")
          IO.puts("Screenshots taken:")
          IO.puts("")
          Enum.each(sorted_by_time, fn path ->
            filename = Path.basename(path)
            log = "  -> http://localhost:8000/#{filename}"
            IO.puts(log)
          end)
        end
      end

      defp select(session, option_name, from: select_name) do
        alias Wallaby.Query

        session
        |> find(Query.select(select_name), fn select ->
          Wallaby.Browser.click(select, Query.option(option_name))
        end)
      end

      def scroll_into_view(session, css_selector) do
        session |> Wallaby.Browser.execute_script("document.querySelector('#{css_selector}').scrollIntoView()")
      end
    end
  end
end
