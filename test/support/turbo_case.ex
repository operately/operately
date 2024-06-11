defmodule OperatelyWeb.TurboCase do
  @moduledoc """
  This module defines the setup for tests requiring
  access to the application's API layer.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      import Plug.Conn
      import OperatelyWeb.TurboCase
    end
  end

  setup tags do
    Operately.DataCase.setup_sandbox(tags)

    conn = 
      Phoenix.ConnTest.build_conn() 
      |> Plug.Conn.put_req_header("content-type", "application/json")

    {:ok, conn: conn}
  end

  defdelegate register_and_log_in_account(context), to: OperatelyWeb.ConnCase
  defdelegate log_in_account(conn, account), to: OperatelyWeb.ConnCase

  def query(conn, query_name, inputs) do
    conn = Phoenix.ConnTest.dispatch(
      conn,
      OperatelyWeb.Endpoint,
      :get,
      query_path(query_name),
      inputs
    )

    case Jason.decode(conn.resp_body, keys: :atoms) do
      {:ok, res} -> {conn.status, res}
      _ -> {conn.status, conn.resp_body}
    end
  end

  defp query_path(query_name) when is_atom(query_name) do
    query_path(Atom.to_string(query_name))
  end

  defp query_path(query_name) when is_binary(query_name) do
    "/api/v2/#{query_name}"
  end
  
end
