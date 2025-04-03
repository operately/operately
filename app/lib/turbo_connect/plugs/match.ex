defmodule TurboConnect.Plugs.Match do
  @moduledoc """
  Recieves a request and resolves the request type, name and handler.

  Only GET and POST requests are supported. GET requests are resolved as queries and POST requests are resolved as mutations.
  PATCH, PUT and DELETE requests are not supported, and will return a 405 Method Not Allowed response.

  Examples:
    GET /get_user -> %{turbo_req_type: :query, turbo_req_name: :get_user, turbo_req_handler: QueryHandler}
    POST /create_user -> %{turbo_req_type: :mutation, turbo_req_name: :create_user, turbo_req_handler: MutationHandler}
  """

  use Plug.Builder

  plug :resolve_http_method
  plug :resolve_request_name
  plug :resolve_request_handler

  def init(api_module) do
    %{api_module: api_module}
  end

  def call(conn, opts) do
    conn
    |> assign(:turbo_api, opts.api_module)
    |> super(opts)
  end

  def resolve_http_method(conn, _opts) do
    case conn.method do
      "GET" -> 
        assign(conn, :turbo_req_type, :query)
      "POST" -> 
        assign(conn, :turbo_req_type, :mutation)
      _ -> 
        err_method_not_allowed(conn)
    end
  end

  def resolve_request_name(conn, _opts) do
    case conn.path_info do
      [] -> err_missing_query_name(conn)
      [name] -> assign(conn, :turbo_req_name, String.to_existing_atom(name))
      _ -> err_invalid_query_name(conn)
    end
  rescue
    _ -> err_unknown_query(conn)
  end

  def resolve_request_handler(conn, _opts) do
    case conn.assigns.turbo_req_type do
      :query -> resolve_query_handler(conn)
      :mutation -> resolve_mutation_handler(conn)
    end
  end

  def resolve_query_handler(conn) do
    conn
    |> get_queries()
    |> Map.get(conn.assigns.turbo_req_name)
    |> case do
      nil -> err_query_not_found(conn)
      query -> assign(conn, :turbo_req_handler, query.handler)
    end
  end

  def resolve_mutation_handler(conn) do
    conn
    |> get_mutations()
    |> Map.get(conn.assigns.turbo_req_name)
    |> case do
      nil -> err_mutation_not_found(conn)
      mutation -> assign(conn, :turbo_req_handler, mutation.handler)
    end
  end

  defp get_queries(conn), do: conn.assigns.turbo_api.__queries__()
  defp get_mutations(conn), do: conn.assigns.turbo_api.__mutations__()

  defp err_method_not_allowed(conn) do
    conn |> send_resp(405, "Method Not Allowed") |> halt()
  end

  defp err_missing_query_name(conn) do
    conn |> send_resp(400, "Missing query name") |> halt()
  end

  defp err_invalid_query_name(conn) do
    conn |> send_resp(400, "Invalid query name") |> halt()
  end

  defp err_mutation_not_found(conn) do
    conn |> send_resp(404, "Mutation not found") |> halt()
  end

  defp err_query_not_found(conn) do
    conn |> send_resp(404, "Query not found") |> halt()
  end

  defp err_unknown_query(conn) do
    conn |> send_resp(404, "Unknown query") |> halt()
  end
end
