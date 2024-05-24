defmodule OperatelyWeb.PageController do
  use OperatelyWeb, :controller

  def index(conn, _params) do
    if configured?() do
      render(conn, :home)
    else
      conn
      |> redirect(to: ~p"/first-time-setup")
      |> halt()
    end
  end

  defp configured?() do
    Operately.Repo.aggregate(Operately.Companies.Company, :count, :id) > 0
  end
end
