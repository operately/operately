{:ok, _} = Application.ensure_all_started(:wallaby)

Application.put_env(:wallaby, :base_url, OperatelyWeb.Endpoint.url())
Application.put_env(:wallaby, :screenshot_dir, "/tmp/screenshots")
Application.put_env(:wallaby, :screenshot_on_failure, true)

ExUnit.configure(formatters: [JUnitFormatter, ExUnit.CLIFormatter])
ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(Operately.Repo, :manual)
