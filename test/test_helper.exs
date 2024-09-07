{:ok, _} = Application.ensure_all_started(:wallaby)

Code.put_compiler_option(:warnings_as_errors, System.get_env("CI") == "true")

Application.put_env(:wallaby, :base_url, OperatelyWeb.Endpoint.url())
Application.put_env(:wallaby, :screenshot_dir, "/tmp/screenshots")
Application.put_env(:wallaby, :screenshot_on_failure, true)

Application.put_env(:operately, :storage_type, "local")

ExUnit.configure(formatters: [JUnitFormatter, CustomFormatter, ExUnit.CLIFormatter])
ExUnit.start([])
