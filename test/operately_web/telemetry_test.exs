defmodule OperatelyWeb.TelemetryTest do
  use OperatelyWeb.ConnCase

  defmodule UDPServer do
    use GenServer

    def start_link(port \\ 8125) do
      GenServer.start_link(__MODULE__, port)
    end

    def init(port) do
      :gen_udp.open(port, [:binary, active: true])
    end

    def handle_info({:udp, _socket, _address, _port, data}, socket) do
      handle_packet(data, socket)
    end

    defp handle_packet("quit\n", socket) do
      IO.puts("Received: quit")
      :gen_udp.close(socket)
      {:stop, :normal, nil}
    end

    defp handle_packet(data, socket) do
      IO.puts("Received: #{inspect(data)}")
      {:noreply, socket}
    end
  end

  alias __MODULE__.UDPServer

  setup do
    {:ok, server} = UDPServer.start_link()
    :timer.sleep(1000)

    {:ok, server: server}
  end

  test "a", ctx do
    Phoenix.ConnTest.dispatch(
      ctx.conn,
      OperatelyWeb.Endpoint,
      :get,
      "/api/v2/get_me",
      %{}
    )

    :timer.sleep(1000)

    # assert MockStatsdServer.get_messages(ctx.server) == []
  end

end
