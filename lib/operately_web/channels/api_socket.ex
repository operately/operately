defmodule OperatelyWeb.ApiSocket do
  use Phoenix.Socket

  @token_name "api-socket-token"
  def gen_token(conn) do
    if conn.assigns[:current_account] do
      id = conn.assigns[:current_account].id
      Phoenix.Token.sign(OperatelyWeb.Endpoint, @token_name, id)
    else
      ""
    end
  end

  # A Socket handler
  #
  # It's possible to control the websocket connection and
  # assign values that can be accessed by your channel topics.

  ## Channels

  channel "api:*", __MODULE__.Channel

  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  # To deny connection, return `:error` or `{:error, term}`. To control the
  # response the client receives in that case, [define an error handler in the
  # websocket
  # configuration](https://hexdocs.pm/phoenix/Phoenix.Endpoint.html#socket/3-websocket-configuration).
  #
  # See `Phoenix.Token` documentation for examples in
  # performing token verification on connect.
  @impl true
  def connect(params, socket, _connect_info) do
    with {:ok, socket} <- authenticate(params, socket) do
      {:ok, socket}
    else
      e -> e
    end
  end

  # Socket IDs are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     Elixir.OperatelyWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  @impl true
  def id(socket), do: "api_socket:#{socket.assigns.account.id}"

  defp authenticate(%{"token" => token}, socket) when is_binary(token) do
    case Phoenix.Token.verify(OperatelyWeb.Endpoint, @token_name, token) do
      {:ok, id} -> assign_current_account(id, socket)
      {:error, _} -> {:error, :unauthorized}
    end
  end

  defp authenticate(_params, _socket) do
    {:error, :unauthorized}
  end

  defp assign_current_account(account_id, socket) do
    account = Operately.People.get_account!(account_id)
    account = Operately.Repo.preload(account, :person)

    if account do
      socket = assign(socket, :account, account)
      {:ok, socket}
    else
      {:error, :unauthorized}
    end
  end

  defmodule Channel do
    use OperatelyWeb, :channel

    @impl true
    def join("api:" <> topic, payload, socket) do
      topic = String.to_existing_atom(topic)
      handler = OperatelyWeb.Api.__subscriptions__()[topic]

      {:ok, socket, topics} = apply(handler, :join, [topic, payload, socket])

      topics = Enum.map(topics, fn t -> "api:#{topic}:#{t}" end)

      {:ok, put_new_topics(socket, topics)}
    end

    @impl true
    def handle_in(_, _payload, socket) do
      # don't allow incoming messages
      {:noreply, socket}
    end

    defp put_new_topics(socket, topics) do
      socket = assign(socket, :topics, [])

      Enum.reduce(topics, socket, fn topic, acc ->
        topics = acc.assigns.topics
        if topic in topics do
          acc
        else
          :ok = OperatelyWeb.Endpoint.subscribe(topic)
          assign(acc, :topics, [topic | topics])
        end
      end)
    end

    alias Phoenix.Socket.Broadcast

    @impl true
    def handle_info(%Broadcast{topic: _, event: event, payload: payload}, socket) do
      push(socket, event, payload)
      {:noreply, socket}
    end
  end

  def broadcast!(topic) do
    OperatelyWeb.Endpoint.broadcast!(topic, "event", %{})
  end
end
