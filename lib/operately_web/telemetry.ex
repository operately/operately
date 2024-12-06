defmodule OperatelyWeb.Telemetry do
  use Supervisor
  import Telemetry.Metrics

  def start_link(arg) do
    Supervisor.start_link(__MODULE__, arg, name: __MODULE__)
  end

  @impl true
  def init(_arg) do
    metrics() |> IO.inspect()
    children = [
      {Telemetry.Metrics.ConsoleReporter, metrics: metrics()}
    ]
    children = children ++ start_vm_metrics()
    children = children ++ start_statsd_if_enabled()

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp start_vm_metrics do
    [{:telemetry_poller, measurements: periodic_measurements(), period: 10_000}]
  end

  defp start_statsd_if_enabled do
    if System.get_env("STATSD_ENABLED") == "yes" do
      host = System.get_env("STATSD_HOST")
      port = System.get_env("STATSD_PORT") |> String.to_integer()

      IO.inspect("Starting statsd reporter")
      [{TelemetryMetricsStatsd, metrics: metrics(), host: host, port: port}]
    else
      []
    end
  end

  def metrics do
    [
      # API metrics
      summary("app.api.request",
        event_name: "phoenix.router_dispatch.stop",
        measurement: :duration,
        tags: [:status_code],
        keep: &log/1
      ),

      # summary("phoenix.endpoint.start.system_time",
      #   unit: {:native, :millisecond}
      # ),
      # summary("phoenix.endpoint.stop.duration",
      #   unit: {:native, :millisecond},
      #   keep: fn a ->
      #     IO.inspect(a.conn.status)
      #     IO.inspect(Map.keys(a.conn))
      #     true
      #   end
      # ),
      # summary("phoenix.router_dispatch.start.system_time",
      #   tags: [:route],
      #   unit: {:native, :millisecond}
      # ),
      # summary("phoenix.router_dispatch.exception.duration",
      #   tags: [:route],
      #   unit: {:native, :millisecond}
      # ),
      # summary("phoenix.router_dispatch.stop.duration",
      #   tags: [:route],
      #   unit: {:native, :millisecond}
      # ),

      # # Database Metrics
      # summary("operately.repo.query.total_time",
      #   unit: {:native, :millisecond},
      #   description: "Total time spent executing a query including queue, query, decode and idle time"
      # ),
      # summary("operately.repo.query.query_time",
      #   unit: {:native, :millisecond},
      #   description: "The time spent executing the query"
      # ),
      # summary("operately.repo.query.queue_time",
      #   unit: {:native, :millisecond},
      #   description: "The time spent waiting for a database connection"
      # ),
    ]
  end

  defp periodic_measurements do
    [
      # A module, function and arguments to be invoked periodically.
      # This function must call :telemetry.execute/3 and a metric must be added above.
      # {OperatelyWeb, :count_users, []}
    ]
  end

  defp log(a) do
    IO.inspect(a.conn.status)
    true
  end
end
