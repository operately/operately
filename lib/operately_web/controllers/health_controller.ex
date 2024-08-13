defmodule OperatelyWeb.HealthController do
  use OperatelyWeb, :controller

  def index(conn, _params) do
    conn |> put_status(:ok) |> text("HEALTHY")
  end
end
