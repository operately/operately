defmodule Operately.PubSub.PostgresPubSub do
  @behaviour Phoenix.PubSub.Adapter

  use GenServer
  require Logger

  alias Operately.Repo

  @name "postgres_pubsub"

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts)
  end

  @impl Phoenix.PubSub.Adapter
  def node_name(adapter_name), do: "#{:erlang.node()}-#{adapter_name}"

  @impl Phoenix.PubSub.Adapter
  def broadcast(adapter_name, topic, message, dispatcher) do
    publish(:except, node_name(adapter_name), topic, message, dispatcher)
  end

  @impl Phoenix.PubSub.Adapter
  def direct_broadcast(_adapter_name, node_name, topic, message, dispatcher) do
    publish(:only, node_name, topic, message, dispatcher)
  end

  #
  # Publish a message to the Postgres channel.
  #
  #  mode       - :except or :only, indicating whether the message should be sent to all nodes except the current one, or only to the current node.
  #  node_name  - the name of the current node.
  #  topic      - the topic to publish the message to.
  #  message    - the message to publish.
  #  dispatcher - the name (module) of the dispatcher that sent the message.
  #
  defp publish(mode, node_name, topic, message, dispatcher) do
    payload = encode_payload(mode, node_name, topic, message, dispatcher)
    {:ok, _} = Repo.query("select pg_notify($1, $2)", [@name, payload])
    :ok
  end

  #
  # Server that listens for Postgres notifications and broadcasts them
  # to the local Phoenix.PubSub.
  #

  defmodule ServerState do
    defstruct [:pubsub_name, :adapter_name, :notifications_pid]
  end

  @impl GenServer
  def init(opts) do
    {:ok, pid} = Postgrex.Notifications.start_link(Operately.Repo.config())
    {:ok, _ref} = Postgrex.Notifications.listen(pid, @name)

    state = %__MODULE__.ServerState{
      pubsub_name: Keyword.get(opts, :pubsub_name, Operately.PubSub),
      adapter_name: Keyword.get(opts, :adapter_name),
      notifications_pid: pid
    }

    {:ok, state}
  end

  @impl GenServer
  def handle_info({:notification, _pid, _ref, _channel, payload}, state) do
    try do
      handle_payload(payload, state)
    rescue
      e -> Logger.error("Error handling Postgres notification: #{inspect(e)}")
    end

    {:noreply, state}
  end

  defp handle_payload(payload, state) do
    payload = decode_payload(payload)
    node_name = node_name(state.adapter_name)
    message = payload.message

    if for_this_node?(payload.mode, payload.node_name, node_name) do
      OperatelyWeb.Endpoint.local_broadcast(message.topic, message.event, message.payload)
    end
  end

  defp for_this_node?(mode, target_node, this_node) do
    case mode do
      :except -> target_node != node_name(this_node)
      :only -> target_node == node_name(this_node)
      _ -> raise "invalid mode: #{mode}"
    end
  end

  #
  # Encode and decode the payload for the Postgres channel.
  #
  defp encode_payload(mode, node_name, topic, message, dispatcher) do
    payload = %{
      mode: mode,
      node_name: node_name,
      topic: topic,
      message: message,
      dispatcher: dispatcher
    }

    payload = :erlang.term_to_binary(payload) 
    payload = Base.url_encode64(payload)

    if byte_size(payload) < 8000 do
      payload
    else
      raise "payload too large, postgrex limit is 8000 bytes"
    end
  end

  defp decode_payload(payload) do
    payload
    |> Base.url_decode64!()
    |> :erlang.binary_to_term()
  end
end
