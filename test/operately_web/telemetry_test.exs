defmodule OperatelyWeb.TelemetryTest do
  use OperatelyWeb.ConnCase

  defmodule UDPServer do
    use GenServer

    def start_link(port \\ 8125) do
      GenServer.start_link(__MODULE__, port)
    end

    def init(port) do
      socket = :gen_udp.open(port, [:binary, active: true])
      {:ok, %{socket: socket, messages: []}}
    end

    def handle_info({:udp, _socket, _address, _port, data}, state) do
      handle_packet(data, state)
    end

    defp handle_packet(data, state) do
      new_messages = String.split(data, "\n")
      log_new_messages(new_messages)

      {:noreply, %{state | messages: state.messages ++ new_messages}}
    end

    defp log_new_messages(messages) do
      Enum.each(messages, fn message -> IO.puts("\n" <> message) end)
    end

    def handle_call(:get_messages, _from, %{messages: messages} = state) do
      {:reply, messages, state}
    end

    def received_message?(server, regex_pattern) do
      :timer.sleep(200)

      messages = GenServer.call(server, :get_messages)
      Enum.find(messages, &Regex.match?(regex_pattern, &1))
    end
  end

  alias __MODULE__.UDPServer

  setup_all do
    {:ok, server} = UDPServer.start_link()
    on_exit(fn -> GenServer.stop(server) end)

    {:ok, server: server}
  end

  test "it records the duration of API requests", ctx do
    api_request(ctx.conn)
    assert UDPServer.received_message?(ctx.server, ~r/operately.api.request.duration:\d+|ms/)
  end

  test "it records the api response codes", ctx do
    api_request(ctx.conn)
    assert UDPServer.received_message?(ctx.server, ~r/operately.api.request.status.401:1|c/)
  end

  test "it records the database query times", ctx do
    Operately.Repo.all(Operately.People.Person)

    assert UDPServer.received_message?(ctx.server, ~r/operately.repo.query.total_time:\d+|ms/)
    assert UDPServer.received_message?(ctx.server, ~r/operately.repo.query.query_time:\d+|ms/)
    assert UDPServer.received_message?(ctx.server, ~r/operately.repo.query.queue_time:\d+|ms/)
  end

  def api_request(conn) do
    Phoenix.ConnTest.dispatch(conn, OperatelyWeb.Endpoint, :get, "/api/v2/get_me", %{})
  end


end
