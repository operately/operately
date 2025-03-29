defmodule Operately.PubSub.PostgresPubSubTest do
  use ExUnit.Case

  alias Operately.PubSub.PostgresPubSub

  @adapter_name :TestAdapterName

  setup do
    # 
    # Why do we need to start the PostgresPubSub process?
    #
    # The application always starts a PostgresPubSub process
    # with a standard adapter name. 
    #
    # In the test environment, we need to start a new process
    # with a different adapter name, so that we can test the
    # how it would work between different nodes. When we start
    # the process, we pass the adapter a custom adapter name
    # so that this process acts as a separate node.
    #

    {:ok, pid} = PostgresPubSub.start_link([
      adapter_name: @adapter_name,
      pubsub_name: Operately.PubSub
    ])

    {:ok, pid: pid}
  end

  test "broadcast/4 sends a message to the Postgres channel" do
    topic = "some:example:channel"

    message = %Phoenix.Socket.Broadcast{
      topic: "some:example:channel",
      event: "new_message",
      payload: %{hello: "world"}
    }

    assert :ok = PostgresPubSub.broadcast(@adapter_name, topic, message, nil)
  end

  test "operately endpoint is able to broadcast messages to the channel" do
    OperatelyWeb.Endpoint.subscribe("some:example:channel")
    OperatelyWeb.Endpoint.broadcast("some:example:channel", "new_message", %{hello: "world"})

    assert_receive %Phoenix.Socket.Broadcast{
      topic: "some:example:channel", 
      event: "new_message", 
      payload: %{hello: "world"}
    }
  end
end
