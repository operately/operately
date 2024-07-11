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

  def connect(params, socket, _connect_info) do
    token = params["token"]

    if token do
      case Phoenix.Token.verify(OperatelyWeb.Endpoint, @token_name, token) do
        {:ok, id} ->
          account = Operately.People.get_account!(id)
          account = Operately.Repo.preload(account, :person)

          if account do
            IO.inspect("HERE -------------------------------------------------------------------------------------------------------------------------------------------------------")
            # socket = assign_context(socket, :current_account, account)

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
