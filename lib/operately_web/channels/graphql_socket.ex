defmodule OperatelyWeb.GraphqlWSSocket do
  use Absinthe.GraphqlWS.Socket, schema: OperatelyWeb.Graphql.Schema

  @token_name "graphql socket token"

  def gen_token(conn) do
    if conn.assigns[:current_account] do
      id = conn.assigns[:current_account].id
      Phoenix.Token.sign(OperatelyWeb.Endpoint, @token_name, id)
    else
      ""
    end
  end

  @impl true
  def handle_init(params, socket) do
    token = params["token"]

    if token do
      case Phoenix.Token.verify(OperatelyWeb.Endpoint, @token_name, token) do
        {:ok, id} ->
          account = Operately.People.get_account!(id)
          account = Operately.Repo.preload(account, :person)

          if account do
            socket = assign_context(socket, :current_account, account)

            {:ok, %{}, socket}
          else
            {:error, :unauthorized}
          end
        {:error, _} ->
          {:error, :unauthorized}
      end
    else
      {:error, :unauthorized}
    end
  end
end
