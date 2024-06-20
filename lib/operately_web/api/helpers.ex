defmodule OperatelyWeb.Api.Helpers do
  defmacro __using__(_) do
    quote do
      import OperatelyWeb.Api.Helpers
      import Ecto.Query, only: [from: 2]

      alias Operately.Repo
    end
  end

  def me(conn) do
    if conn.assigns.current_account do
      conn.assigns.current_account.person
    else
      raise "No account associated with the connection, maybe you forgot to load the account in a plug?"
    end
  end
end
