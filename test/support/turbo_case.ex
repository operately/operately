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
      import Operately.Support.Tabletest

      alias OperatelyWeb.Api.Serializer
      alias OperatelyWeb.Paths
      alias Operately.Repo
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

  def log_in_account(ctx, person_name) when is_atom(person_name) do
    alias Operately.Support.Fixtures

    person = Fixtures.get(ctx, person_name)
    company = Fixtures.get(ctx, :company)
    account = person |> Operately.Repo.preload(:account) |> Map.get(:account)

    conn = log_in_account(ctx.conn, account, company)

    Map.put(ctx, :conn, conn)
  end

  defdelegate log_in_account(conn, account), to: OperatelyWeb.ConnCase
  defdelegate log_in_account(conn, account, company), to: OperatelyWeb.ConnCase

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
