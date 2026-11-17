defmodule Operately.Support.ApplicationLifecycle do
  use GenServer

  import ExUnit.Assertions
  import Mock

  def run do
    # Keep the real HTTP listener enabled, but avoid the shared test server's port.
    endpoint_config = Application.fetch_env!(:operately, OperatelyWeb.Endpoint)
    Application.put_env(:operately, OperatelyWeb.Endpoint, Keyword.put(endpoint_config, :http, ip: {127, 0, 0, 1}, port: 0))

    owner = self()

    with_mocks [
      # Manual certification needs no CA requests or additional local listener.
      {OperatelyWeb.Certification, [:passthrough], [directory_url: fn -> "https://acme.invalid/directory" end, mode: fn -> :manual end]},
      {OperatelyWeb.Endpoint, [:passthrough],
       [
         start_link: fn opts ->
           # This runs synchronously at the actual endpoint startup boundary, before
           # the application supervisor can proceed to its next child.
           send(owner, {:endpoint_starting, dependencies()})
           {:ok, endpoint} = :meck.passthrough([opts])
           {:ok, _} = Supervisor.start_child(endpoint, {__MODULE__, fn -> send(owner, {:endpoint_stopping, dependencies()}) end})
           {:ok, endpoint}
         end
       ]}
    ] do
      {:ok, _} = Application.ensure_all_started(:operately)

      {:ok, _} =
        Supervisor.start_child(Oban.whereis(Oban), {
          __MODULE__,
          fn -> send(owner, {:oban_stopping, Process.whereis(OperatelyWeb.Endpoint)}) end
        })

      :ok = Application.stop(:operately)

      assert_receive {:endpoint_starting, startup}
      assert %Oban.Config{name: Oban, repo: Operately.Repo} = startup.oban
      assert is_pid(startup.repo)
      assert is_pid(startup.finch)
      assert is_pid(startup.pubsub)

      assert_receive {:endpoint_stopping, shutdown}
      assert %Oban.Config{name: Oban, repo: Operately.Repo} = shutdown.oban
      assert is_pid(shutdown.repo)
      assert is_pid(shutdown.finch)
      assert is_pid(shutdown.pubsub)
      assert_receive {:oban_stopping, nil}
    end
  end

  def start_link(on_shutdown), do: GenServer.start_link(__MODULE__, on_shutdown)

  @impl true
  def init(on_shutdown) do
    Process.flag(:trap_exit, true)
    {:ok, on_shutdown}
  end

  @impl true
  def terminate(:shutdown, on_shutdown), do: on_shutdown.()

  defp dependencies do
    %{
      oban: oban_config(),
      repo: Process.whereis(Operately.Repo),
      finch: Process.whereis(Operately.Finch),
      pubsub: Process.whereis(Operately.PubSub)
    }
  end

  defp oban_config do
    Oban.config()
  rescue
    error in RuntimeError -> {:unavailable, Exception.message(error)}
  end
end

Operately.Support.ApplicationLifecycle.run()
