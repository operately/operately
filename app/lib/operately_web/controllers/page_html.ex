defmodule OperatelyWeb.PageHTML do
  use OperatelyWeb, :html

  embed_templates "page.html"

  def disable_react_devtools(assigns \\ %{}) do
    ~H"""
    <script>
      (function() {
        var info = console.info

        console.info = function (message) {
          if (!/Download the React DevTools/.test(message)) info.apply(console, arguments)
        }
      })()
    </script>
    """
  end

  def inject_app_config(app_config) do
    ~H"""
    <script>
      window.appConfig = <%= Jason.encode!(app_config) |> Phoenix.HTML.raw() %>
    </script>
    """  
  end

  def load_js_application(assigns \\ %{}) do
    if Application.get_env(:operately, :app_env) == :dev do
      dev_script_tags(assigns)
    else
      prod_script_tags(assigns)
    end
  end

  defp dev_script_tags(assigns) do
    ~H"""
    <script type="module">
      import RefreshRuntime from 'http://localhost:4005/@react-refresh'
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>

    <script type="module" src={"http://localhost:4005" <> "/@vite/client"}></script>
    <script type="module" src={"http://localhost:4005" <> "/assets/js/app.tsx"}></script>
    """
  end

  defp prod_script_tags(assigns) do
    manifest = File.read!(Path.join(:code.priv_dir(:operately), "static/.vite/manifest.json")) |> Jason.decode!()
    app_js_path = manifest["assets/js/app.tsx"]["file"]

    ~H"""
    <script defer phx-track-static type="text/javascript" src={~p"/#{app_js_path}"} />
    """
  end
end
