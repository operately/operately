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

      alias OperatelyWeb.Api.Serializer
      alias OperatelyWeb.Paths
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
      request_path(query_name),
      inputs
    )

    case Jason.decode(conn.resp_body, keys: :atoms) do
      {:ok, res} -> {conn.status, res}
      _ -> {conn.status, conn.resp_body}
    end
  end

  def mutation(conn, mutation_name, inputs) do
    conn = Phoenix.ConnTest.dispatch(
      conn,
      OperatelyWeb.Endpoint,
      :post,
      request_path(mutation_name),
      inputs
    )

    case Jason.decode(conn.resp_body, keys: :atoms) do
      {:ok, res} -> {conn.status, res}
      _ -> {conn.status, conn.resp_body}
    end
  end

  defp request_path(name) when is_atom(name) do
    request_path(Atom.to_string(name))
  end

  defp request_path(name) when is_binary(name) do
    "/api/v2/#{name}"
  end

  def bad_request_response do
    {400, %{error: "Bad request", message: "The request was malformed"}}
  end

  def not_found_response do
    {404, %{error: "Not found", message: "The requested resource was not found"}}
  end
  
end
