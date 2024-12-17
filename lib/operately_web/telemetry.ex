defmodule OperatelyWeb.Telemetry do
  use Supervisor
  import Telemetry.Metrics

  def start_link(arg) do
    Supervisor.start_link(__MODULE__, arg, name: __MODULE__)
  end

  @impl true
  def init(_arg) do
    children = []
    children = children ++ start_vm_metrics()
    children = children ++ start_statsd_if_enabled()

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp start_vm_metrics do
    [{:telemetry_poller, measurements: periodic_measurements(), period: 10_000}]
  end

  defp start_statsd_if_enabled do
    config = statsd_config()

    if config.enabled do
      [{TelemetryMetricsStatsd, metrics: metrics(), host: config.host, port: config.port}]
    else
      []
    end
  end

  def metrics do
    [
      # API Metrics
      counter("operately.api.request.status",
        event_name: "phoenix.router_dispatch.stop",
        tag_values: fn meta -> Map.put(meta, :status, meta.conn.status) end,
        tags: [:status]
      ),
      summary("operately.api.request.duration",
        event_name: "phoenix.router_dispatch.stop",
        measurement: :duration,
        unit: {:native, :millisecond},
        keep: fn a -> String.starts_with?(a.conn.request_path, "/api/v2") end
      ),

      # Database Metrics
      summary("operately.repo.query.total_time",
        unit: {:native, :millisecond},
        description: "Total time spent executing a query including queue, query, decode and idle time"
      ),
      summary("operately.repo.query.query_time",
        unit: {:native, :millisecond},
        description: "The time spent executing the query"
      ),
      summary("operately.repo.query.queue_time",
        unit: {:native, :millisecond},
        description: "The time spent waiting for a database connection"
      )
    ]
  end

  defp periodic_measurements do
    [
      # A module, function and arguments to be invoked periodically.
      # This function must call :telemetry.execute/3 and a metric must be added above.
      # {OperatelyWeb, :count_users, []}
    ]
  end

  defp statsd_config do
    if Application.get_env(:operately, :app_env) == :test do
      %{host: "localhost", port: 8125, enabled: true}
    else
      enabled = System.get_env("STATSD_ENABLED") == "yes"
      
      if enabled do
        host = System.get_env("STATSD_HOST")
        port = System.get_env("STATSD_PORT") |> Integer.parse() |> elem(0)

        %{host: host, port: port, enabled: enabled}
      else
        %{enabled: false}
      end
    end
  end

end
