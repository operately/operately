defmodule OperatelyWeb.PageController do
  use OperatelyWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
