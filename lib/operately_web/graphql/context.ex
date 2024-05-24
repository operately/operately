defmodule OperatelyWeb.Graphql.Context do
  @public_operations [
    "AddFirstCompany",
  ]

  def init(opts), do: opts

  def call(conn, _) do
    operation = conn.params["operationName"]

    if operation in @public_operations do
      public_operation(conn)
    else
      private_operation(conn)
    end
  end

  #
  # If the operation is a public operation, we don't need to
  # authenticate the request.
  #
  defp public_operation(conn) do
    conn
  end

  #
  # If the operation is not public, we need to authenticate 
  # the request. The :fetch_current_account in the router 
  # is responsible for fetching the current account and
  # assigning it to the conn. In this function, we only need
  # to check if the current account is assigned to the conn.
  # 
  defp private_operation(conn) do
    if conn.assigns[:current_account] do
      current_account = conn.assigns[:current_account]
      context = %{current_account: current_account}

      Absinthe.Plug.put_options(conn, context: context)

      conn
    else
      Plug.Conn.send_resp(conn, 401, "Unauthorized")
    end
  end
end
