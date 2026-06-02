{:ok, _} = Application.ensure_all_started(:wallaby)

Application.put_env(:wallaby, :base_url, OperatelyWeb.Endpoint.url())
Application.put_env(:wallaby, :screenshot_dir, "/tmp/screenshots")
Application.put_env(:wallaby, :screenshot_on_failure, true)

Application.put_env(:operately, :storage_type, "local")

if report_file = System.get_env("JUNIT_REPORT_FILE") do
  Application.put_env(:junit_formatter, :report_file, report_file)
end

ExUnit.configure(formatters: [JUnitFormatter, CustomFormatter])
ExUnit.start([])
