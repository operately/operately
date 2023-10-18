defmodule OperatelyWeb.Graphql.Context do
  def init(opts), do: opts

  def call(conn, _) do
    current_account = conn.assigns[:current_account]
    context = %{current_account: current_account}

    Absinthe.Plug.put_options(conn, context: context)
  end
end
