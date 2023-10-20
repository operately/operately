defmodule OperatelyWeb.AccountSessionController do
  use OperatelyWeb, :controller

  alias OperatelyWeb.AccountAuth

  def new(conn, _params) do
    render(conn, :new, error_message: nil, layout: false)
  end

  def delete(conn, _params) do
    IO.inspect(conn)
    IO.inspect("HEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE")
    conn
    |> put_flash(:info, "Logged out successfully.")
    |> AccountAuth.log_out_account()
  end
end
