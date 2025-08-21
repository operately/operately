defmodule Operately.FeatureCase do
  use ExUnit.CaseTemplate

  defmacro __using__(_) do
    quote do
      use ExUnit.Case, async: false
      use Wallaby.Feature

      import Operately.FeatureSteps

      alias Operately.Repo
      alias Operately.Support.Features.UI
      alias OperatelyWeb.Paths
      alias Operately.Support.Factory

      import Wallaby.Browser, except: [assert_text: 2, click: 2, fill: 2, find: 2, visit: 1]

      import Operately.FeatureCase

      setup data do
        Wallaby.Browser.resize_window(data.session, 1920, 2000)

        screenshots_before = Path.wildcard("/tmp/screenshots/*")

        on_exit(fn ->
          screenshots_after = Path.wildcard("/tmp/screenshots/*")
          list_screenshots(screenshots_before, screenshots_after)
        end)

        :ok
      end

      defp list_screenshots(screenshots_before, screenshots_after) do
        diff = screenshots_after -- screenshots_before
        sorted_by_time = Enum.sort(diff, fn a, b -> File.stat!(a).mtime > File.stat!(b).mtime end)

        if sorted_by_time != [] do
          IO.puts("")
          IO.puts("")
          IO.puts(blue("    Screenshots:"))

          Enum.each(sorted_by_time, fn path ->
            filename = Path.basename(path)
            IO.puts("    http://localhost:8000/#{filename}")
          end)
        end
      end

      defp red(text), do: IO.ANSI.red() <> text <> IO.ANSI.reset()
      defp green(text), do: IO.ANSI.green() <> text <> IO.ANSI.reset()
      defp blue(text), do: IO.ANSI.blue() <> text <> IO.ANSI.reset()

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

      defp attempts(ctx, n, fun) do
        try do
          fun.()
          ctx
        rescue
          e in [ExUnit.AssertionError] ->
            if n > 0 do
              Process.sleep(200)
              attempts(ctx, n - 1, fun)
            else
              raise e
            end
        end
      end
    end
  end

  defmacro set_app_config(key, value) do
    quote do
      setup ctx do
        previous_value = Application.get_env(:operately, unquote(key))
        Application.put_env(:operately, unquote(key), unquote(value))

        on_exit(fn ->
          Application.put_env(:operately, unquote(key), previous_value)
        end)

        {:ok, ctx}
      end
    end
  end
end
