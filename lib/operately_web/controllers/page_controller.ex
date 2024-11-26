defmodule OperatelyWeb.PageController do
  use OperatelyWeb, :controller

  def index(conn, _params) do
    render(conn, :page)
  end

end
